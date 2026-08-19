import { matchesItemSearch } from "../../electron/item-search.js";

const STORAGE = {
  bills: "billmaster.preview.bills",
  items: "billmaster.preview.items",
  ledgers: "billmaster.preview.ledgers",
  challans: "billmaster.preview.challans",
};

function read(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const browserFallback = {
  async saveBill(bill) {
    const bills = read(STORAGE.bills);
    const now = new Date().toISOString();
    const id = bill.id || Math.max(0, ...bills.map((entry) => entry.id)) + 1;
    const saved = { ...bill, id, createdAt: bill.createdAt || now, updatedAt: now };
    const index = bills.findIndex((entry) => entry.id === id);
    if (index >= 0) bills[index] = saved;
    else bills.unshift(saved);
    write(STORAGE.bills, bills);
    return { success: true, billId: id };
  },
  async getBills() {
    return read(STORAGE.bills);
  },
  async getBill(id) {
    return read(STORAGE.bills).find((bill) => bill.id === Number(id)) || null;
  },
  async deleteBill(id) {
    const bills = read(STORAGE.bills);
    const remaining = bills.filter((bill) => bill.id !== Number(id));
    write(STORAGE.bills, remaining);
    return { deleted: remaining.length !== bills.length };
  },
  async getItems(query = "", limit = 100) {
    const matches = read(STORAGE.items)
      .filter((item) => matchesItemSearch(item.name, query))
      .sort((a, b) => a.name.localeCompare(b.name));
    return Number.isInteger(limit) && limit > 0 ? matches.slice(0, limit) : matches;
  },
  async addItems(entries) {
    const items = read(STORAGE.items);
    const known = new Set(items.map((item) => item.name.toLocaleLowerCase()));
    let added = 0;
    const addedItems = [];
    entries.forEach((entry) => {
      const details = typeof entry === "string" ? { name: entry } : entry;
      const name = String(details.name ?? "").trim().replace(/\s+/g, " ");
      if (name && !known.has(name.toLocaleLowerCase())) {
        const item = {
          id: crypto.randomUUID(),
          name,
          rate: Math.max(0, Number(details.rate) || 0),
          per: String(details.per ?? "").trim(),
        };
        items.push(item);
        addedItems.push(item);
        known.add(name.toLocaleLowerCase());
        added += 1;
      }
    });
    write(STORAGE.items, items);
    const firstName = String(
      (typeof entries[0] === "string" ? entries[0] : entries[0]?.name) ?? "",
    ).trim();
    const item = addedItems[0] || items.find(
      (entry) => entry.name.toLocaleLowerCase() === firstName.toLocaleLowerCase(),
    );
    return { added, skipped: entries.length - added, item, items: addedItems };
  },
  async deleteItem(id) {
    const items = read(STORAGE.items);
    write(STORAGE.items, items.filter((item) => item.id !== id));
    return { deleted: true };
  },
  async deleteItems(ids) {
    const selected = new Set(ids);
    const items = read(STORAGE.items);
    const remaining = items.filter((item) => !selected.has(item.id));
    write(STORAGE.items, remaining);
    return { deleted: items.length - remaining.length };
  },
  async updateItem(id, rawDetails) {
    const currentItems = read(STORAGE.items);
    const current = currentItems.find((entry) => entry.id === id);
    const details = typeof rawDetails === "string"
      ? { ...current, name: rawDetails }
      : rawDetails;
    const name = String(details?.name ?? "").trim().replace(/\s+/g, " ");
    if (!name) throw new Error("Item name is required.");
    const items = currentItems;
    if (items.some((item) => item.id !== id && item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      throw new Error("An item with this name already exists.");
    }
    const item = items.find((entry) => entry.id === id);
    if (!item) throw new Error("Item was not found.");
    item.name = name;
    item.rate = Math.max(0, Number(details.rate) || 0);
    item.per = String(details.per ?? "").trim();
    write(STORAGE.items, items);
    return { updated: true, item };
  },
  async updateItems(entries) {
    const items = read(STORAGE.items);
    const updates = entries.map((entry) => ({
      id: entry.id,
      name: String(entry.name ?? "").trim().replace(/\s+/g, " "),
      rate: Math.max(0, Number(entry.rate) || 0),
      per: String(entry.per ?? "").trim(),
    }));
    if (updates.some((item) => !item.name)) throw new Error("Every item must have a name.");
    const finalItems = items.map((item) => updates.find((update) => update.id === item.id) || item);
    const names = new Set();
    finalItems.forEach((item) => {
      const key = item.name.toLocaleLowerCase();
      if (names.has(key)) throw new Error(`The item name "${item.name}" is duplicated.`);
      names.add(key);
    });
    write(STORAGE.items, finalItems);
    return { updated: updates.length, items: updates };
  },
  async getLedgers(query = "") {
    const normalized = query.toLocaleLowerCase();
    return read(STORAGE.ledgers)
      .filter((ledger) => ledger.name.toLocaleLowerCase().includes(normalized))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
  async addLedger(rawName) {
    const name = String(rawName).trim().replace(/\s+/g, " ");
    if (!name) throw new Error("Ledger name is required.");
    const ledgers = read(STORAGE.ledgers);
    const existing = ledgers.find((ledger) => ledger.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    if (existing) return { added: false, ledger: existing };
    const ledger = { id: crypto.randomUUID(), name };
    ledgers.push(ledger);
    write(STORAGE.ledgers, ledgers);
    return { added: true, ledger };
  },
  async deleteLedger(id) {
    const ledgers = read(STORAGE.ledgers);
    const remaining = ledgers.filter((ledger) => ledger.id !== id);
    write(STORAGE.ledgers, remaining);
    return { deleted: remaining.length !== ledgers.length };
  },
  async deleteLedgers(ids) {
    const selected = new Set(ids);
    const ledgers = read(STORAGE.ledgers);
    const remaining = ledgers.filter((ledger) => !selected.has(ledger.id));
    write(STORAGE.ledgers, remaining);
    return { deleted: ledgers.length - remaining.length };
  },
  async updateLedger(id, rawName) {
    const name = String(rawName).trim().replace(/\s+/g, " ");
    if (!name) throw new Error("Ledger name is required.");
    const ledgers = read(STORAGE.ledgers);
    if (ledgers.some((ledger) => ledger.id !== id && ledger.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      throw new Error("A ledger with this name already exists.");
    }
    const ledger = ledgers.find((entry) => entry.id === id);
    if (!ledger) throw new Error("Ledger was not found.");
    ledger.name = name;
    write(STORAGE.ledgers, ledgers);
    return { updated: true, ledger };
  },
  async saveChallan(challan) {
    const challans = read(STORAGE.challans);
    const now = new Date().toISOString();
    const id = challan.id || Math.max(0, ...challans.map((entry) => Number(entry.id) || 0)) + 1;
    const saved = { ...challan, id, createdAt: challan.createdAt || now, updatedAt: now };
    const index = challans.findIndex((entry) => entry.id === id);
    if (index >= 0) challans[index] = saved;
    else challans.unshift(saved);
    write(STORAGE.challans, challans);
    return { success: true, challanId: id };
  },
  async getChallans() {
    return read(STORAGE.challans).sort((a, b) => Number(b.id) - Number(a.id));
  },
  async getChallan(id) {
    return read(STORAGE.challans).find((challan) => challan.id === Number(id)) || null;
  },
  async deleteChallan(id) {
    const challans = read(STORAGE.challans);
    const remaining = challans.filter((challan) => challan.id !== Number(id));
    write(STORAGE.challans, remaining);
    return { deleted: remaining.length !== challans.length };
  },
  async getPrinters() {
    return [];
  },
  async print() {
    window.print();
    return { success: true };
  },
};

export const api = window.electronAPI || browserFallback;
