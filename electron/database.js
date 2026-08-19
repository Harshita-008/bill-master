import Database from "better-sqlite3";
import { matchesItemSearch } from "./item-search.js";

let db;

export function initializeDatabase(databasePath) {
  db = new Database(databasePath);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  db.exec(`
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

    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      party_name TEXT NOT NULL,
      items_total REAL NOT NULL DEFAULT 0,
      charges_total REAL NOT NULL DEFAULT 0,
      previous_amount REAL NOT NULL DEFAULT 0,
      grand_total REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bill_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
      item_name TEXT NOT NULL,
      rate REAL NOT NULL DEFAULT 0,
      qty REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      amount REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS bill_charges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
      charge_name TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS challans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      to_line_1 TEXT NOT NULL DEFAULT '',
      to_line_2 TEXT NOT NULL DEFAULT '',
      to_line_3 TEXT NOT NULL DEFAULT '',
      challan_date TEXT NOT NULL DEFAULT '',
      box_count TEXT NOT NULL DEFAULT '',
      delivered_by TEXT NOT NULL DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const columns = db.prepare("PRAGMA table_info(bills)").all();
  if (!columns.some((column) => column.name === "updated_at")) {
    db.exec("ALTER TABLE bills ADD COLUMN updated_at DATETIME");
    db.exec("UPDATE bills SET updated_at = created_at WHERE updated_at IS NULL");
  }
  if (!columns.some((column) => column.name === "previous_amount")) {
    db.exec("ALTER TABLE bills ADD COLUMN previous_amount REAL NOT NULL DEFAULT 0");
  }

  const itemColumns = db.prepare("PRAGMA table_info(bill_items)").all();
  if (!itemColumns.some((column) => column.name === "unit")) {
    db.exec("ALTER TABLE bill_items ADD COLUMN unit TEXT NOT NULL DEFAULT ''");
  }
  if (!itemColumns.some((column) => column.name === "note")) {
    db.exec("ALTER TABLE bill_items ADD COLUMN note TEXT NOT NULL DEFAULT ''");
  }

  const masterItemColumns = db.prepare("PRAGMA table_info(items)").all();
  if (!masterItemColumns.some((column) => column.name === "rate")) {
    db.exec("ALTER TABLE items ADD COLUMN rate REAL NOT NULL DEFAULT 0");
  }
  if (!masterItemColumns.some((column) => column.name === "unit")) {
    db.exec("ALTER TABLE items ADD COLUMN unit TEXT NOT NULL DEFAULT ''");
  }

}

export function closeDatabase() {
  if (db?.open) db.close();
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function cleanNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeBill(bill) {
  const items = (bill.items ?? bill.billItems ?? [])
    .filter((item) => cleanText(item.itemName))
    .map((item) => ({
      itemName: cleanText(item.itemName),
      rate: cleanNumber(item.rate),
      quantity: Math.max(1, Math.trunc(cleanNumber(item.quantity ?? item.qty) || 1)),
      per: cleanText(item.per),
      note: cleanText(item.note),
      amount: cleanNumber(item.amount),
    }));
  const charges = (bill.charges ?? [])
    .filter((charge) => cleanText(charge.name))
    .map((charge) => ({
      name: cleanText(charge.name),
      amount: cleanNumber(charge.amount),
    }));
  const itemsTotal = items.reduce((sum, item) => sum + item.amount, 0);
  const chargesTotal = charges.reduce((sum, charge) => sum + charge.amount, 0);
  const previousAmount = cleanNumber(bill.previousAmount);

  return {
    companyName: cleanText(bill.companyName ?? bill.partyName),
    items,
    charges,
    itemsTotal,
    chargesTotal,
    previousAmount,
    grandTotal: itemsTotal + chargesTotal + previousAmount,
  };
}

export function saveBill(payload) {
  const bill = normalizeBill(payload);
  if (!bill.companyName) throw new Error("Company name is required.");
  if (!bill.items.length) throw new Error("Add at least one item.");

  return db.transaction(() => {
    let billId = Number(payload.id) || null;
    if (billId) {
      const exists = db.prepare("SELECT id FROM bills WHERE id = ?").get(billId);
      if (!exists) throw new Error("Bill not found.");
      db.prepare(`
        UPDATE bills
        SET party_name = ?, items_total = ?, charges_total = ?, previous_amount = ?,
            grand_total = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        bill.companyName,
        bill.itemsTotal,
        bill.chargesTotal,
        bill.previousAmount,
        bill.grandTotal,
        billId,
      );
      db.prepare("DELETE FROM bill_items WHERE bill_id = ?").run(billId);
      db.prepare("DELETE FROM bill_charges WHERE bill_id = ?").run(billId);
    } else {
      const result = db.prepare(`
        INSERT INTO bills (party_name, items_total, charges_total, previous_amount, grand_total)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        bill.companyName,
        bill.itemsTotal,
        bill.chargesTotal,
        bill.previousAmount,
        bill.grandTotal,
      );
      billId = Number(result.lastInsertRowid);
    }

    const insertItem = db.prepare(`
      INSERT INTO bill_items (bill_id, item_name, rate, qty, unit, note, amount)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    bill.items.forEach((item) => {
      insertItem.run(
        billId,
        item.itemName,
        item.rate,
        item.quantity,
        item.per,
        item.note,
        item.amount,
      );
    });

    const insertCharge = db.prepare(`
      INSERT INTO bill_charges (bill_id, charge_name, amount)
      VALUES (?, ?, ?)
    `);
    bill.charges.forEach((charge) => {
      insertCharge.run(billId, charge.name, charge.amount);
    });
    return { success: true, billId };
  })();
}

export function getBills() {
  return db.prepare(`
    SELECT id, party_name AS companyName, items_total AS itemsTotal,
           charges_total AS chargesTotal, previous_amount AS previousAmount,
           grand_total AS grandTotal,
           created_at AS createdAt, updated_at AS updatedAt
    FROM bills ORDER BY id DESC
  `).all();
}

export function getBill(id) {
  const bill = db.prepare(`
    SELECT id, party_name AS companyName, items_total AS itemsTotal,
           charges_total AS chargesTotal, previous_amount AS previousAmount,
           grand_total AS grandTotal,
           created_at AS createdAt, updated_at AS updatedAt
    FROM bills WHERE id = ?
  `).get(id);
  if (!bill) return null;

  bill.items = db.prepare(`
    SELECT id, item_name AS itemName, rate, qty AS quantity, unit AS per, note, amount
    FROM bill_items WHERE bill_id = ? ORDER BY id
  `).all(id);
  bill.charges = db.prepare(`
    SELECT id, charge_name AS name, amount
    FROM bill_charges WHERE bill_id = ? ORDER BY id
  `).all(id);
  return bill;
}

export function deleteBill(id) {
  return {
    deleted: db.prepare("DELETE FROM bills WHERE id = ?").run(id).changes > 0,
  };
}

export function clearBills() {
  return db.transaction(() => {
    const count = db.prepare("SELECT COUNT(*) AS count FROM bills").get().count;
    db.prepare("DELETE FROM bills").run();
    db.prepare(`
      DELETE FROM sqlite_sequence
      WHERE name IN ('bills', 'bill_items', 'bill_charges')
    `).run();
    return { deleted: count };
  })();
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

function normalizeChallan(payload) {
  return {
    toLine1: cleanText(payload.toLine1),
    toLine2: cleanText(payload.toLine2),
    toLine3: cleanText(payload.toLine3),
    challanDate: cleanText(payload.challanDate),
    boxCount: cleanText(payload.boxCount),
    deliveredBy: cleanText(payload.deliveredBy),
  };
}

export function saveChallan(payload) {
  const challan = normalizeChallan(payload);
  let challanId = Number(payload.id) || null;
  if (challanId) {
    const result = db.prepare(`
      UPDATE challans
      SET to_line_1 = ?, to_line_2 = ?, to_line_3 = ?, challan_date = ?,
          box_count = ?, delivered_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      challan.toLine1,
      challan.toLine2,
      challan.toLine3,
      challan.challanDate,
      challan.boxCount,
      challan.deliveredBy,
      challanId,
    );
    if (!result.changes) throw new Error("Challan was not found.");
  } else {
    const result = db.prepare(`
      INSERT INTO challans (to_line_1, to_line_2, to_line_3, challan_date, box_count, delivered_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      challan.toLine1,
      challan.toLine2,
      challan.toLine3,
      challan.challanDate,
      challan.boxCount,
      challan.deliveredBy,
    );
    challanId = Number(result.lastInsertRowid);
  }
  return { success: true, challanId };
}

const challanSelect = `
  SELECT id, to_line_1 AS toLine1, to_line_2 AS toLine2, to_line_3 AS toLine3,
         challan_date AS challanDate, box_count AS boxCount, delivered_by AS deliveredBy,
         created_at AS createdAt, updated_at AS updatedAt
  FROM challans
`;

export function getChallans() {
  return db.prepare(`${challanSelect} ORDER BY id DESC`).all();
}

export function getChallan(id) {
  return db.prepare(`${challanSelect} WHERE id = ?`).get(id) || null;
}

export function deleteChallan(id) {
  return { deleted: db.prepare("DELETE FROM challans WHERE id = ?").run(id).changes > 0 };
}
