const MM_TO_PX = 96 / 25.4;

export const BILL_PAGE_LAYOUT = {
  A6: {
    width: 397,
    height: 559,
    padding: 7 * MM_TO_PX,
    headerGap: 4 * MM_TO_PX,
  },
  A4: {
    width: 794,
    height: 1123,
    padding: 14 * MM_TO_PX,
    headerGap: 7 * MM_TO_PX,
  },
};

export function createBillRows(bill) {
  const itemRows = (bill.items || []).map((item, index) => ({
    kind: "item",
    key: `item-${item.key || item.id || index}-${index}`,
    value: item,
  }));
  const chargeRows = (bill.charges || []).map((charge, index) => ({
    kind: "charge",
    key: `charge-${charge.key || charge.id || index}-${index}`,
    value: charge,
  }));
  const previousRows = Number(bill.previousAmount) !== 0
    ? [{ kind: "previous", key: "previous-amount", value: bill.previousAmount }]
    : [];

  return [...itemRows, ...chargeRows, ...previousRows];
}

// every page ends with a total row (carried forward, or the final total),
// and every page after the first starts with a brought forward row
export function paginateBillRows({
  rows,
  rowHeights,
  firstPageCapacity,
  continuationPageCapacity,
  footerHeight,
  broughtForwardHeight = 0,
}) {
  const heightOf = (row) => Math.max(1, Number(rowHeights.get(row.key)) || 1);
  const pages = [];
  let page = [];
  let used = 0;

  rows.forEach((row) => {
    const capacity = pages.length === 0 ? firstPageCapacity : continuationPageCapacity - broughtForwardHeight;
    if (page.length && used + heightOf(row) > capacity - footerHeight) {
      pages.push(page);
      page = [];
      used = 0;
    }
    page.push(row);
    used += heightOf(row);
  });
  pages.push(page);
  return pages;
}
