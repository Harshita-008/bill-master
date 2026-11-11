const PRICE_ONLY = /^(rs\.?|₹)?\s*[\d,]+(\.\d+)?$/i;
const UNIT_ONLY = /^(pc|pcs|pk|pkt|set|nos|no|kg|gm|ltr|mtr|box|doz|dz)\.?$/i;

// a cell that is only a rate (550.00) or only a unit (PC) is not an item
export function isRateOrUnit(value) {
  return PRICE_ONLY.test(value) || UNIT_ONLY.test(value);
}

export function cleanCell(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

// "Rs. 1,250.50" -> 1250.5, blank -> null
export function parseRate(value) {
  const match = cleanCell(value).match(/\d[\d,]*(\.\d+)?/);
  if (!match) return null;
  const rate = Number(match[0].replace(/,/g, ""));
  return Number.isFinite(rate) ? rate : null;
}
