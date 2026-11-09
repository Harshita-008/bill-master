// same item twice in a file -> keep the last filled values
export function combineImportedItems(entries) {
  const byName = new Map();
  entries.forEach((entry) => {
    const key = entry.name.toLocaleLowerCase();
    const saved = byName.get(key);
    byName.set(key, {
      name: saved?.name || entry.name,
      rate: entry.rate ?? saved?.rate ?? null,
      per: entry.per || saved?.per || "",
    });
  });
  return [...byName.values()];
}

// blank file values keep the old ones, filled values override
export function mergeItem(current, incoming) {
  const oldRate = Number(current.rate) || 0;
  const oldPer = current.per || "";
  const rate = incoming.rate ?? oldRate;
  const per = incoming.per || oldPer;
  if (rate === oldRate && per === oldPer) return null;
  return { rate, per };
}
