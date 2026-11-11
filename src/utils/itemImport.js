import { guessColumns, isPriceList } from "./guessColumns.js";
import { findColumns, hasDetailColumns, isHeaderName } from "./importColumns.js";
import { cleanCell, isRateOrUnit, parseRate } from "./importValues.js";

// skip empty cells, headers and cells that are only a rate or a unit
function isItemName(name) {
  return Boolean(name) && !isHeaderName(name) && !isRateOrUnit(name);
}

// old style sheet: every filled cell is an item name
function readNamesOnly(rows) {
  return rows.flat()
    .map(cleanCell)
    .filter(isItemName)
    .map((name) => ({ name, rate: null, per: "" }));
}

// sheet with name, rate and per columns
function readTable(rows, columns) {
  return rows
    .map((row) => ({
      name: cleanCell(row[columns.name]),
      rate: columns.rate === -1 ? null : parseRate(row[columns.rate]),
      per: columns.per === -1 ? "" : cleanCell(row[columns.per]),
    }))
    .filter((item) => isItemName(item.name));
}

function readSheet(rows) {
  // 1. a header row like Item | Rate | Per
  const headerIndex = rows.findIndex((row) => hasDetailColumns(findColumns(row)));
  if (headerIndex !== -1) return readTable(rows.slice(headerIndex + 1), findColumns(rows[headerIndex]));

  // 2. no headers, but the cells look like name | rate | per (like a tally stock summary)
  const guessed = guessColumns(rows);
  if (isPriceList(guessed)) return readTable(rows, guessed);

  // 3. just a list of names
  return readNamesOnly(rows);
}

export function extractItems(sheetRows) {
  return sheetRows.flatMap(readSheet);
}
