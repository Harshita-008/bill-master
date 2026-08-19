import Database from "better-sqlite3";
import XLSX from "xlsx";

const [workbookPath, databasePath] = process.argv.slice(2);
if (!workbookPath || !databasePath) {
  throw new Error("Usage: audit-item-import.mjs <workbook.xlsx> <billmaster.db>");
}

const workbook = XLSX.readFile(workbookPath);
const headerPattern = /^(item\s*name|items?|name)$/i;
const cells = [];

workbook.SheetNames.forEach((sheetName) => {
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    raw: false,
    defval: "",
  });
  rows.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      const name = String(cell ?? "").trim().replace(/\s+/g, " ");
      if (name) cells.push({ sheetName, row: rowIndex + 1, column: columnIndex + 1, name });
    });
  });
});

const names = cells.filter((cell) => !headerPattern.test(cell.name));
const groups = new Map();
names.forEach((cell) => {
  const key = cell.name.toLocaleLowerCase();
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(cell);
});

const database = new Database(databasePath, { readonly: true });
const saved = database.prepare("SELECT name FROM items ORDER BY name COLLATE NOCASE").all();
database.close();
const savedKeys = new Set(saved.map(({ name }) => name.trim().replace(/\s+/g, " ").toLocaleLowerCase()));
const workbookKeys = new Set(groups.keys());
const missing = [...groups.entries()]
  .filter(([key]) => !savedKeys.has(key))
  .map(([, entries]) => entries[0]);
const extras = saved.filter(({ name }) => (
  !workbookKeys.has(name.trim().replace(/\s+/g, " ").toLocaleLowerCase())
));
const duplicates = [...groups.values()].filter((entries) => entries.length > 1);

console.log(JSON.stringify({
  sheets: workbook.SheetNames.length,
  populatedCells: cells.length,
  ignoredHeaders: cells.length - names.length,
  itemCells: names.length,
  uniqueItemNamesCaseInsensitive: groups.size,
  duplicateCells: names.length - groups.size,
  duplicateGroups: duplicates.length,
  savedItems: saved.length,
  uniqueWorkbookNamesMissingFromDatabase: missing.length,
  savedItemsAbsentFromWorkbook: extras.length,
  extraSavedItems: extras,
  sampleDuplicateGroups: duplicates.slice(0, 20).map((entries) => ({
    name: entries[0].name,
    occurrences: entries.length,
    locations: entries.map((entry) => `${entry.sheetName}!R${entry.row}C${entry.column}`),
  })),
  sampleMissing: missing.slice(0, 50),
}, null, 2));
