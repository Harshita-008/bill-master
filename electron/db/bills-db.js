import { addMissingColumn, cleanNumber, cleanText, openDatabase } from "./open.js";

// bills keep their own copy of item name, rate and per, so they do not need the items file
export const BILLS_TABLES = ["bills", "bill_items", "bill_charges"];

const SCHEMA = `
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
    amount REAL NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS bill_charges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    charge_name TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0
  );
`;

let db;

export function openBillsDb(file) {
  db = openDatabase(file, SCHEMA);
  if (addMissingColumn(db, "bills", "updated_at", "DATETIME")) {
    db.exec("UPDATE bills SET updated_at = created_at WHERE updated_at IS NULL");
  }
  addMissingColumn(db, "bills", "previous_amount", "REAL NOT NULL DEFAULT 0");
  addMissingColumn(db, "bill_items", "unit", "TEXT NOT NULL DEFAULT ''");
  return db;
}

export function closeBillsDb() {
  if (db?.open) db.close();
}

function normalizeBill(bill) {
  const items = (bill.items ?? bill.billItems ?? [])
    .filter((item) => cleanText(item.itemName))
    .map((item) => ({
      itemName: cleanText(item.itemName),
      rate: cleanNumber(item.rate),
      quantity: Math.max(0, Math.trunc(cleanNumber(item.quantity ?? item.qty))),
      per: cleanText(item.per),
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
      INSERT INTO bill_items (bill_id, item_name, rate, qty, unit, amount)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    bill.items.forEach((item) => {
      insertItem.run(
        billId,
        item.itemName,
        item.rate,
        item.quantity,
        item.per,
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
    SELECT id, item_name AS itemName, rate, qty AS quantity, unit AS per, amount
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
