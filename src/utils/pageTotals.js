// how much one row adds to the bill
function rowAmount(row) {
  if (row.kind === "previous") return Number(row.value) || 0;
  return Number(row.value?.amount) || 0;
}

// running total for each page: what came from earlier pages, and the total up to this page
export function pageTotals(pages) {
  let running = 0;
  return pages.map((page) => {
    const broughtForward = running;
    running += page.reduce((sum, row) => sum + rowAmount(row), 0);
    return { broughtForward, carriedForward: running };
  });
}
