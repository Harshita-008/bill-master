import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";
import {
  addItems,
  closeDatabase,
  getItemCount,
  initializeDatabase,
} from "../electron/database.js";
import { extractItemNames } from "../src/utils/itemImport.js";

const workbookPath = path.resolve(process.argv[2]);
const databasePath = path.resolve(process.argv[3] || "billmaster.db");

if (!fs.existsSync(workbookPath) || !/\.(xlsx|xls|csv)$/i.test(workbookPath)) {
  throw new Error(`Workbook not found or unsupported: ${workbookPath}`);
}
if (path.basename(databasePath).toLowerCase() !== "billmaster.db") {
  throw new Error(`Refusing to update unexpected database: ${databasePath}`);
}

const workbook = XLSX.readFile(workbookPath, { raw: false });
const sheetRows = workbook.SheetNames.map((sheetName) => (
  XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    raw: false,
    defval: "",
  })
));
const names = extractItemNames(sheetRows);

try {
  initializeDatabase(databasePath);
  const countBefore = getItemCount();
  const result = addItems(names);
  const countAfter = getItemCount();
  console.log(JSON.stringify({
    workbookPath,
    databasePath,
    worksheets: workbook.SheetNames.length,
    extractedNames: names.length,
    countBefore,
    ...result,
    countAfter,
  }));
} finally {
  closeDatabase();
}
