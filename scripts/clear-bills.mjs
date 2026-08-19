import path from "node:path";
import {
  clearBills,
  closeDatabase,
  initializeDatabase,
} from "../electron/database.js";

const databasePath = path.resolve(process.argv[2] || "billmaster.db");

if (path.basename(databasePath).toLowerCase() !== "billmaster.db") {
  throw new Error(`Refusing to clear unexpected database: ${databasePath}`);
}

try {
  initializeDatabase(databasePath);
  const result = clearBills();
  console.log(JSON.stringify({ databasePath, ...result }));
} finally {
  closeDatabase();
}
