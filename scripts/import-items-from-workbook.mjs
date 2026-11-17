import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";
import {
  closeDatabase,
  getItemCount,
  importItems,
  initializeDatabase,
} from "../electron/database.js";
import { DB_FILES } from "../electron/db/files.js";
import { extractItems } from "../src/utils/itemImport.js";

const workbookPath = path.resolve(process.argv[2]);
// folder that holds billmaster-items.db (the project folder by default)
const folder = path.resolve(process.argv[3] || ".");

if (!fs.existsSync(workbookPath) || !/\.(xlsx|xls|csv)$/i.test(workbookPath)) {
  throw new Error(`Workbook not found or unsupported: ${workbookPath}`);
}
if (!fs.existsSync(path.join(folder, DB_FILES.items))) {
  throw new Error(`No ${DB_FILES.items} in: ${folder}`);
}

const workbook = XLSX.readFile(workbookPath, { raw: false });
const sheetRows = workbook.SheetNames.map((sheetName) => (
  XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    raw: false,
    defval: "",
  })
));
const items = extractItems(sheetRows);

try {
  initializeDatabase(folder);
  const countBefore = getItemCount();
  const result = importItems(items);
  const countAfter = getItemCount();
  console.log(JSON.stringify({
    workbookPath,
    folder,
    worksheets: workbook.SheetNames.length,
    extractedItems: items.length,
    countBefore,
    ...result,
    countAfter,
  }));
} finally {
  closeDatabase();
}
