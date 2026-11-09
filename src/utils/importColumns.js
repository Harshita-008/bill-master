import { cleanCell } from "./importValues.js";

const NAME_HEADER = /^(item\s*name|items?|name|product(\s*name)?|particulars?|description)$/i;
const RATE_HEADER = /^(rate|price|mrp|cost)\b/i;
const PER_HEADER = /^(per|unit|units|uom|pc|pcs)\b/i;

export function isHeaderName(value) {
  return NAME_HEADER.test(cleanCell(value));
}

// find which column has name, rate and per (-1 if missing)
export function findColumns(row) {
  const cells = row.map(cleanCell);
  return {
    name: cells.findIndex((cell) => NAME_HEADER.test(cell)),
    rate: cells.findIndex((cell) => RATE_HEADER.test(cell)),
    per: cells.findIndex((cell) => PER_HEADER.test(cell)),
  };
}

export function hasDetailColumns(columns) {
  return columns.name !== -1 && (columns.rate !== -1 || columns.per !== -1);
}
