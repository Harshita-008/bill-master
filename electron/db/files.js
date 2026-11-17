import fs from "node:fs";
import path from "node:path";

// three separate files, so deleting one never touches the others
export const DB_FILES = {
  bills: "billmaster-bills.db",
  challans: "billmaster-challans.db",
  items: "billmaster-items.db",
};

// older versions kept everything in this one file (it is split, then deleted)
export const OLD_DB_FILE = "billmaster.db";
// backup left by version 0.0.45, removed on start
export const OLD_BACKUP_FILE = "billmaster-before-split.db";

// true when the folder already has any BillMaster data (new or old)
export function hasAnyDatabase(folder) {
  const names = [...Object.values(DB_FILES), OLD_DB_FILE];
  return names.some((name) => fs.existsSync(path.join(folder, name)));
}
