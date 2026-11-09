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
