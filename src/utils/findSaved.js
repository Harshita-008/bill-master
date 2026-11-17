import { api } from "../services/api";

const sameName = (a, b) => a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();

// the saved item with exactly this name (any case), or null
export async function findSavedItem(name) {
  if (!name.trim()) return null;
  const items = await api.getItems(name, null);
  return items.find((item) => sameName(item.name, name)) || null;
}

// the saved ledger with exactly this name (any case), or null
export async function findSavedLedger(name) {
  if (!name.trim()) return null;
  const ledgers = await api.getLedgers(name);
  return ledgers.find((ledger) => sameName(ledger.name, name)) || null;
}
