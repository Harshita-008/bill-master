import fs from "node:fs";
import path from "node:path";
import { DB_FILES } from "../electron/db/files.js";
import {
  clearBills,
  closeDatabase,
  initializeDatabase,
} from "../electron/database.js";

// folder that holds billmaster-bills.db (the project folder by default)
const folder = path.resolve(process.argv[2] || ".");

if (!fs.existsSync(path.join(folder, DB_FILES.bills))) {
  throw new Error(`No ${DB_FILES.bills} in: ${folder}`);
}

try {
  initializeDatabase(folder);
  const result = clearBills();
  console.log(JSON.stringify({ folder, ...result }));
} finally {
  closeDatabase();
}
