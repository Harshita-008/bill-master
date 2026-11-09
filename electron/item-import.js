import { combineImportedItems, mergeItem } from "./item-merge.js";

export function runItemImport(db, entries) {
  const find = db.prepare("SELECT id, name, rate, unit AS per FROM items WHERE name = ? COLLATE NOCASE");
  const insert = db.prepare("INSERT INTO items (name, rate, unit) VALUES (?, ?, ?)");
  const update = db.prepare("UPDATE items SET rate = ?, unit = ? WHERE id = ?");

  return db.transaction(() => {
    const result = { added: 0, updated: 0, unchanged: 0 };
    combineImportedItems(entries).forEach((item) => {
      const current = find.get(item.name);
      if (!current) {
        insert.run(item.name, item.rate ?? 0, item.per);
        result.added += 1;
        return;
      }
      const changes = mergeItem(current, item);
      if (!changes) {
        result.unchanged += 1;
        return;
      }
      update.run(changes.rate, changes.per, current.id);
      result.updated += 1;
    });
    return result;
  })();
}
