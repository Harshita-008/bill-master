const HEADER_PATTERN = /^(item\s*name|items?|name)$/i;

export function extractItemNames(sheetRows) {
  const names = [];

  sheetRows.forEach((rows) => {
    rows.forEach((row) => {
      row.forEach((cell) => {
        const name = String(cell ?? "").trim().replace(/\s+/g, " ");
        if (name && !HEADER_PATTERN.test(name)) names.push(name);
      });
    });
  });

  return names;
}
