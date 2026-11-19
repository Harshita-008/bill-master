const cleanName = (name) => String(name ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase();

export function sameItemName(first, second) {
  return cleanName(first) === cleanName(second);
}

// index of another row that already has this row's item, -1 if none
export function findDuplicateRow(items, key) {
  const row = items.find((item) => item.key === key);
  if (!cleanName(row?.itemName)) return -1;
  return items.findIndex((item) => item.key !== key && sameItemName(item.itemName, row.itemName));
}
