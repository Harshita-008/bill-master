import { findColumns, hasDetailColumns, isHeaderName } from "./importColumns.js";
import { cleanCell, parseRate } from "./importValues.js";

// old style sheet: every filled cell is an item name
function readNamesOnly(rows) {
  return rows.flat()
    .map(cleanCell)
    .filter((name) => name && !isHeaderName(name))
    .map((name) => ({ name, rate: null, per: "" }));
}

// sheet with a header row like Item | Rate | Per
function readTable(rows, columns) {
  return rows
    .map((row) => ({
      name: cleanCell(row[columns.name]),
      rate: columns.rate === -1 ? null : parseRate(row[columns.rate]),
      per: columns.per === -1 ? "" : cleanCell(row[columns.per]),
    }))
    .filter((item) => item.name && !isHeaderName(item.name));
}

function readSheet(rows) {
  const headerIndex = rows.findIndex((row) => hasDetailColumns(findColumns(row)));
  if (headerIndex === -1) return readNamesOnly(rows);
  return readTable(rows.slice(headerIndex + 1), findColumns(rows[headerIndex]));
}

export function extractItems(sheetRows) {
  return sheetRows.flatMap(readSheet);
}
