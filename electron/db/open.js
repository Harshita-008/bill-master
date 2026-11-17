import Database from "better-sqlite3";

// open one database file the same way for bills, challans and items
export function openDatabase(file, schema) {
  const db = new Database(file);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  db.exec(schema);
  return db;
}

// older files may miss a column added later
export function addMissingColumn(db, table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (columns.some((entry) => entry.name === column)) return false;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  return true;
}

export function cleanText(value) {
  return String(value ?? "").trim();
}

export function cleanNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}
