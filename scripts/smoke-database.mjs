import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  addItems,
  addLedger,
  closeDatabase,
  deleteBill,
  deleteLedger,
  getBill,
  getBills,
  getItems,
  getLedgers,
  initializeDatabase,
  saveBill,
  updateItem,
  updateLedger,
} from "../electron/database.js";

const databasePath = path.join(os.tmpdir(), `billmaster-test-${Date.now()}.db`);

try {
  initializeDatabase(databasePath);
  const imported = addItems(["Cement", "cement", " Bricks ", "Bricks", ...Array.from(
    { length: 125 },
    (_, index) => `Item ${String(index + 1).padStart(3, "0")}`,
  )]);
  if (imported.added !== 127 || imported.skipped !== 2 || getItems("CE").length !== 1) {
    throw new Error("Item master test failed.");
  }
  if (getItems("").length !== 100 || getItems("", null).length !== 127) {
    throw new Error("Full item master listing test failed.");
  }
  const cementId = getItems("Cement")[0].id;
  updateItem(cementId, "Cement Plus");
  if (getItems("Cement Plus").length !== 1) throw new Error("Item rename test failed.");
  addLedger("Acme");
  addLedger("acme");
  if (getLedgers("AC").length !== 1) throw new Error("Ledger master test failed.");
  const ledgerId = getLedgers("AC")[0].id;
  if (!deleteLedger(ledgerId).deleted || getLedgers("AC").length !== 0) {
    throw new Error("Ledger deletion test failed.");
  }
  addLedger("Acme");
  const renamedLedgerId = getLedgers("Acme")[0].id;
  updateLedger(renamedLedgerId, "Acme Updated");
  if (getLedgers("Acme Updated").length !== 1) throw new Error("Ledger rename test failed.");

  const saved = saveBill({
    companyName: "Acme",
    items: [{ itemName: "Cement", rate: 12.5, quantity: 4, per: "pkt", amount: 50 }],
    charges: [{ name: "Delivery", amount: 10 }],
  });
  const bill = getBill(saved.billId);
  if (
    bill.grandTotal !== 60
    || bill.items[0].quantity !== 4
    || bill.items[0].per !== "pkt"
    || getBills().length !== 1
  ) {
    throw new Error("Bill save/read test failed.");
  }

  saveBill({ ...bill, companyName: "Acme Updated" });
  if (getBill(saved.billId).companyName !== "Acme Updated" || getBills().length !== 1) {
    throw new Error("Bill update test failed.");
  }
  if (!deleteBill(saved.billId).deleted || getBills().length !== 0) {
    throw new Error("Bill deletion test failed.");
  }

  console.log(JSON.stringify({
    itemImport: imported,
    ledgerMaster: "ok",
    savedBillId: saved.billId,
    total: bill.grandTotal,
    update: "ok",
    deletion: "ok",
  }));
} finally {
  closeDatabase();
  for (const suffix of ["", "-wal", "-shm"]) {
    const target = databasePath + suffix;
    if (fs.existsSync(target)) fs.unlinkSync(target);
  }
}
