import fs from "node:fs";
import path from "node:path";
import { BILLS_TABLES, closeBillsDb, openBillsDb } from "./db/bills-db.js";
import { CHALLANS_TABLES, closeChallansDb, openChallansDb } from "./db/challans-db.js";
import { DB_FILES } from "./db/files.js";
import { ITEMS_TABLES, closeItemsDb, openItemsDb } from "./db/items-db.js";
import { splitOldDatabase } from "./db/split-old-database.js";

export {
  clearBills, deleteBill, getBill, getBills, saveBill,
} from "./db/bills-db.js";
export {
  deleteChallan, getChallan, getChallans, saveChallan,
} from "./db/challans-db.js";
export {
  addItems, addLedger, deleteItem, deleteItems, deleteLedger, deleteLedgers, getItemCount,
  getItems, getLedgers, importItems, updateItem, updateItems, updateLedger,
} from "./db/items-db.js";

// open the bills, challans and items files that live in this folder
export function initializeDatabase(folder) {
  fs.mkdirSync(folder, { recursive: true });
  const parts = [
    { db: openItemsDb(path.join(folder, DB_FILES.items)), tables: ITEMS_TABLES },
    { db: openBillsDb(path.join(folder, DB_FILES.bills)), tables: BILLS_TABLES },
    { db: openChallansDb(path.join(folder, DB_FILES.challans)), tables: CHALLANS_TABLES },
  ];
  return { splitBackup: splitOldDatabase(folder, parts) };
}

export function closeDatabase() {
  closeItemsDb();
  closeBillsDb();
  closeChallansDb();
}
