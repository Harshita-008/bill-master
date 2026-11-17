import fs from "node:fs";
import path from "node:path";
import { OLD_BACKUP_FILE, OLD_DB_FILE } from "./files.js";

function columnsOf(db, schema, table) {
  return db.prepare(`PRAGMA ${schema}.table_info(${table})`).all().map((column) => column.name);
}

function countOf(db, schema, table) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${schema}.${table}`).get().count;
}

// skip leftover lines of bills that were already deleted
function liveRows(columns) {
  return columns.includes("bill_id") ? " WHERE bill_id IN (SELECT id FROM old.bills)" : "";
}

// copy one part's tables from the old file (same ids, so bill numbers stay), true when all rows are there
function copyTables(db, oldFile, tables) {
  db.prepare("ATTACH DATABASE ? AS old").run(oldFile);
  try {
    const isEmpty = tables.every((table) => countOf(db, "main", table) === 0);
    return db.transaction(() => tables.every((table) => {
      const oldColumns = columnsOf(db, "old", table);
      if (!oldColumns.length) return true;
      const shared = columnsOf(db, "main", table).filter((column) => oldColumns.includes(column)).join(", ");
      if (isEmpty) db.exec(`INSERT INTO main.${table} (${shared}) SELECT ${shared} FROM old.${table}${liveRows(oldColumns)}`);
      const oldCount = db.prepare(`SELECT COUNT(*) AS count FROM old.${table}${liveRows(oldColumns)}`).get().count;
      return countOf(db, "main", table) >= oldCount;
    }))();
  } finally {
    db.exec("DETACH DATABASE old");
  }
}

function removeWithSidecars(file) {
  for (const suffix of ["-wal", "-shm", ""]) fs.rmSync(`${file}${suffix}`, { force: true });
}

// older versions kept everything in one billmaster.db: move it into the three files, then delete it
export function splitOldDatabase(folder, parts) {
  removeWithSidecars(path.join(folder, OLD_BACKUP_FILE));
  const oldFile = path.join(folder, OLD_DB_FILE);
  if (!fs.existsSync(oldFile)) return false;
  const allCopied = parts.map(({ db, tables }) => copyTables(db, oldFile, tables)).every(Boolean);
  // only delete the old file once every row is safely in the new files
  if (allCopied) removeWithSidecars(oldFile);
  return allCopied;
}
