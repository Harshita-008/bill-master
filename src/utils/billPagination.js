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

export function paginateBillRows({
  rows,
  rowHeights,
  firstPageCapacity,
  continuationPageCapacity,
  footerHeight,
}) {
  const pages = [];
  let rowIndex = 0;

  while (rowIndex < rows.length) {
    const capacity = pages.length === 0 ? firstPageCapacity : continuationPageCapacity;
    const pageRows = [];
    let usedHeight = 0;

    while (rowIndex < rows.length) {
      const row = rows[rowIndex];
      const rowHeight = Math.max(1, Number(rowHeights.get(row.key)) || 1);
      const remainingHeight = rows.slice(rowIndex).reduce(
        (total, remainingRow) => total + Math.max(1, Number(rowHeights.get(remainingRow.key)) || 1),
        footerHeight,
      );

      if (usedHeight + remainingHeight <= capacity) {
        pageRows.push(...rows.slice(rowIndex));
        rowIndex = rows.length;
        break;
      }

      if (pageRows.length > 0 && usedHeight + rowHeight > capacity) break;
      pageRows.push(row);
      usedHeight += rowHeight;
      rowIndex += 1;
    }

    pages.push(pageRows);
  }

  if (pages.length === 0) pages.push([]);

  const lastPageIndex = pages.length - 1;
  const lastCapacity = lastPageIndex === 0 ? firstPageCapacity : continuationPageCapacity;
  const lastRowsHeight = pages[lastPageIndex].reduce(
    (total, row) => total + Math.max(1, Number(rowHeights.get(row.key)) || 1),
    0,
  );
  if (lastRowsHeight + footerHeight > lastCapacity) {
    const nextPageRows = [];
    let nextPageHeight = footerHeight;
    while (pages[lastPageIndex].length > 1) {
      const candidate = pages[lastPageIndex][pages[lastPageIndex].length - 1];
      const candidateHeight = Math.max(1, Number(rowHeights.get(candidate.key)) || 1);
      if (nextPageHeight + candidateHeight > continuationPageCapacity) break;
      nextPageRows.unshift(pages[lastPageIndex].pop());
      nextPageHeight += candidateHeight;
    }
    pages.push(nextPageRows);
  }

  return pages;
}
