import fs from "node:fs";
import path from "node:path";
import { BEFORE_SPLIT_FILE, OLD_DB_FILE } from "./files.js";

function columnsOf(db, schema, table) {
  return db.prepare(`PRAGMA ${schema}.table_info(${table})`).all().map((column) => column.name);
}

function isEmpty(db, tables) {
  return tables.every((table) => db.prepare(`SELECT COUNT(*) AS count FROM main.${table}`).get().count === 0);
}

// copy one part's tables from the old file, keeping the same ids (so bill numbers stay)
function copyTables(db, oldFile, tables) {
  if (!isEmpty(db, tables)) return;
  db.prepare("ATTACH DATABASE ? AS old").run(oldFile);
  try {
    db.transaction(() => {
      tables.forEach((table) => {
        const oldColumns = columnsOf(db, "old", table);
        if (!oldColumns.length) return;
        const shared = columnsOf(db, "main", table).filter((column) => oldColumns.includes(column)).join(", ");
        // skip leftover lines of bills that were already deleted
        const onlyLiveBills = oldColumns.includes("bill_id") ? " WHERE bill_id IN (SELECT id FROM old.bills)" : "";
        db.exec(`INSERT INTO main.${table} (${shared}) SELECT ${shared} FROM old.${table}${onlyLiveBills}`);
      });
    })();
  } finally {
    db.exec("DETACH DATABASE old");
  }
}

// keep the old file as a backup, under a name that is never read again
function moveAside(oldFile, backupFile) {
  const target = fs.existsSync(backupFile) ? backupFile.replace(/\.db$/, `-${Date.now()}.db`) : backupFile;
  for (const suffix of ["-wal", "-shm", ""]) {
    if (fs.existsSync(`${oldFile}${suffix}`)) fs.renameSync(`${oldFile}${suffix}`, `${target}${suffix}`);
  }
  return target;
}

// older versions kept everything in one billmaster.db, split it once into the three files
export function splitOldDatabase(folder, parts) {
  const oldFile = path.join(folder, OLD_DB_FILE);
  if (!fs.existsSync(oldFile)) return null;
  parts.forEach(({ db, tables }) => copyTables(db, oldFile, tables));
  return moveAside(oldFile, path.join(folder, BEFORE_SPLIT_FILE));
}
