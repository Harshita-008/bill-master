const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

export function importMessage({ added, updated, unchanged }) {
  return `${plural(added, "new item")} added, ${plural(updated, "item")} updated, ${unchanged} unchanged.`;
}
