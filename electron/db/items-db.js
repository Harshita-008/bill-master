import { matchesItemSearch } from "../item-search.js";
import { runItemImport } from "../item-import.js";
import { addMissingColumn, cleanNumber, cleanText, openDatabase } from "./open.js";

// items with rate and per, plus ledger names (used by both bills and challans)
export const ITEMS_TABLES = ["items", "ledgers"];

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL COLLATE NOCASE UNIQUE,
    rate REAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ledgers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL COLLATE NOCASE UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

let db;

export function openItemsDb(file) {
  db = openDatabase(file, SCHEMA);
  addMissingColumn(db, "items", "rate", "REAL NOT NULL DEFAULT 0");
  addMissingColumn(db, "items", "unit", "TEXT NOT NULL DEFAULT ''");
  return db;
}

export function closeItemsDb() {
  if (db?.open) db.close();
}

export function getItems(query = "", limit = 100) {
  const items = db.prepare(`
    SELECT id, name, rate, unit AS per FROM items
    ORDER BY name COLLATE NOCASE
  `).all().filter((item) => matchesItemSearch(item.name, query));
  return Number.isInteger(limit) && limit > 0 ? items.slice(0, limit) : items;
}

export function getItemCount() {
  return db.prepare("SELECT COUNT(*) AS count FROM items").get().count;
}

export function getLedgers(query = "") {
  const search = `%${cleanText(query)}%`;
  return db.prepare(`
    SELECT id, name FROM ledgers
    WHERE name LIKE ? COLLATE NOCASE
    ORDER BY name COLLATE NOCASE
  `).all(search);
}

export function addLedger(name) {
  const normalized = cleanText(name).replace(/\s+/g, " ");
  if (!normalized) throw new Error("Ledger name is required.");
  const result = db.prepare("INSERT OR IGNORE INTO ledgers (name) VALUES (?)").run(normalized);
  const ledger = db.prepare("SELECT id, name FROM ledgers WHERE name = ? COLLATE NOCASE").get(normalized);
  return { added: result.changes > 0, ledger };
}

export function deleteLedger(id) {
  return { deleted: db.prepare("DELETE FROM ledgers WHERE id = ?").run(id).changes > 0 };
}

export function deleteLedgers(ids) {
  const normalized = [...new Set(ids.map(Number).filter(Number.isInteger))];
  if (!normalized.length) return { deleted: 0 };
  const placeholders = normalized.map(() => "?").join(", ");
  const result = db.prepare(`DELETE FROM ledgers WHERE id IN (${placeholders})`).run(...normalized);
  return { deleted: result.changes };
}

export function updateLedger(id, name) {
  const normalized = cleanText(name).replace(/\s+/g, " ");
  if (!normalized) throw new Error("Ledger name is required.");
  const existing = db.prepare(
    "SELECT id FROM ledgers WHERE name = ? COLLATE NOCASE AND id <> ?",
  ).get(normalized, id);
  if (existing) throw new Error("A ledger with this name already exists.");
  const result = db.prepare("UPDATE ledgers SET name = ? WHERE id = ?").run(normalized, id);
  if (!result.changes) throw new Error("Ledger was not found.");
  return { updated: true, ledger: { id, name: normalized } };
}

function normalizeMasterItem(value) {
  if (typeof value === "string") {
    return { name: cleanText(value).replace(/\s+/g, " "), rate: 0, per: "" };
  }
  return {
    name: cleanText(value?.name).replace(/\s+/g, " "),
    rate: Math.max(0, cleanNumber(value?.rate)),
    per: cleanText(value?.per ?? value?.unit),
  };
}

export function addItems(entries) {
  const insert = db.prepare("INSERT OR IGNORE INTO items (name, rate, unit) VALUES (?, ?, ?)");
  const normalized = entries.map(normalizeMasterItem).filter((item) => item.name);

  return db.transaction(() => {
    let added = 0;
    const addedItems = [];
    normalized.forEach((item) => {
      const result = insert.run(item.name, item.rate, item.per);
      added += result.changes;
      if (result.changes) {
        addedItems.push({ id: Number(result.lastInsertRowid), ...item });
      }
    });
    const first = normalized[0];
    const item = addedItems[0] || (first
      ? db.prepare("SELECT id, name, rate, unit AS per FROM items WHERE name = ? COLLATE NOCASE").get(first.name)
      : null);
    return { added, skipped: normalized.length - added, item, items: addedItems };
  })();
}

export function importItems(entries) {
  return runItemImport(db, entries);
}

export function deleteItem(id) {
  return { deleted: db.prepare("DELETE FROM items WHERE id = ?").run(id).changes > 0 };
}

export function deleteItems(ids) {
  const normalized = [...new Set(ids.map(Number).filter(Number.isInteger))];
  if (!normalized.length) return { deleted: 0 };
  const placeholders = normalized.map(() => "?").join(", ");
  const result = db.prepare(`DELETE FROM items WHERE id IN (${placeholders})`).run(...normalized);
  return { deleted: result.changes };
}

export function updateItem(id, details) {
  const current = db.prepare("SELECT id, name, rate, unit AS per FROM items WHERE id = ?").get(id);
  if (!current) throw new Error("Item was not found.");
  const normalized = typeof details === "string"
    ? { ...current, name: cleanText(details).replace(/\s+/g, " ") }
    : normalizeMasterItem(details);
  if (!normalized.name) throw new Error("Item name is required.");
  const existing = db.prepare(
    "SELECT id FROM items WHERE name = ? COLLATE NOCASE AND id <> ?",
  ).get(normalized.name, id);
  if (existing) throw new Error("An item with this name already exists.");
  db.prepare("UPDATE items SET name = ?, rate = ?, unit = ? WHERE id = ?")
    .run(normalized.name, normalized.rate, normalized.per, id);
  return { updated: true, item: { id, ...normalized } };
}

export function updateItems(entries) {
  const normalized = entries.map((entry) => ({
    id: Number(entry.id),
    ...normalizeMasterItem(entry),
  }));
  if (normalized.some((item) => !Number.isInteger(item.id) || !item.name)) {
    throw new Error("Every item must have a name.");
  }
  const names = new Set();
  normalized.forEach((item) => {
    const key = item.name.toLocaleLowerCase();
    if (names.has(key)) throw new Error(`The item name "${item.name}" is duplicated.`);
    names.add(key);
  });

  return db.transaction(() => {
    const editedIds = new Set(normalized.map((item) => item.id));
    normalized.forEach((item) => {
      const current = db.prepare("SELECT id FROM items WHERE id = ?").get(item.id);
      if (!current) throw new Error("One of the items was not found.");
      const existing = db.prepare("SELECT id FROM items WHERE name = ? COLLATE NOCASE").get(item.name);
      if (existing && !editedIds.has(existing.id)) {
        throw new Error(`An item named "${item.name}" already exists.`);
      }
    });

    const temporaryName = db.prepare("UPDATE items SET name = ? WHERE id = ?");
    normalized.forEach((item, index) => {
      temporaryName.run(`__bulk_edit_${Date.now()}_${index}_${item.id}`, item.id);
    });

    const update = db.prepare("UPDATE items SET name = ?, rate = ?, unit = ? WHERE id = ?");
    normalized.forEach((item) => update.run(item.name, item.rate, item.per, item.id));
    return { updated: normalized.length, items: normalized };
  })();
}
