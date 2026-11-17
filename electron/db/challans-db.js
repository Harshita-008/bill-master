import { cleanText, openDatabase } from "./open.js";

export const CHALLANS_TABLES = ["challans"];

const SCHEMA = `
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
`;

let db;

export function openChallansDb(file) {
  db = openDatabase(file, SCHEMA);
  return db;
}

export function closeChallansDb() {
  if (db?.open) db.close();
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
