import { cleanCell } from "./importValues.js";

const PRICE = /^(rs\.?|₹)?\s*[\d,]+(\.\d+)?$/i;
const UNIT = /^[a-z.]{1,6}$/i;

function columnCells(rows, index) {
  return rows.map((row) => cleanCell(row[index])).filter(Boolean);
}

function share(cells, test) {
  return cells.filter(test).length / cells.length;
}

// a unit column has short words like PC / PK / SET that repeat
function looksLikeUnits(cells) {
  const kinds = new Set(cells.map((cell) => cell.toLowerCase())).size;
  const fewKinds = kinds <= 5 || kinds <= cells.length / 2;
  return fewKinds && share(cells, (cell) => UNIT.test(cell)) >= 0.9;
}

// sheet without headers: work out name, rate and per from what is in the cells
export function guessColumns(rows) {
  const columns = { name: -1, rate: -1, per: -1 };
  const width = Math.max(0, ...rows.map((row) => row.length));

  for (let index = 0; index < width; index += 1) {
    const cells = columnCells(rows, index);
    if (!cells.length) continue;
    if (columns.rate === -1 && share(cells, (cell) => PRICE.test(cell)) >= 0.8) columns.rate = index;
    else if (columns.name === -1) columns.name = index;
    else if (columns.per === -1 && looksLikeUnits(cells)) columns.per = index;
  }
  return columns;
}

// only trust a guess when there is a name and a rate column, a plain name list has no rates
export function isPriceList(columns) {
  return columns.name !== -1 && columns.rate !== -1;
}
