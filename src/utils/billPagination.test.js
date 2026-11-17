import { describe, expect, it } from "vitest";
import { paginateBillRows } from "./billPagination";

function rows(count) {
  return Array.from({ length: count }, (_, index) => ({ key: `row-${index}` }));
}

describe("paginateBillRows", () => {
  it("keeps room for a total line at the bottom of every page", () => {
    const billRows = rows(12);
    const heights = new Map(billRows.map((row) => [row.key, 100]));

    const pages = paginateBillRows({
      rows: billRows,
      rowHeights: heights,
      firstPageCapacity: 410,
      continuationPageCapacity: 470,
      footerHeight: 30,
    });

    // 410 - 30 fits 3 rows, 470 - 30 fits 4 rows
    expect(pages.map((page) => page.length)).toEqual([3, 4, 4, 1]);
    expect(pages.flat().map((row) => row.key)).toEqual(billRows.map((row) => row.key));
  });

  it("also keeps room for brought forward at the top of later pages", () => {
    const billRows = rows(9);
    const heights = new Map(billRows.map((row) => [row.key, 100]));

    const pages = paginateBillRows({
      rows: billRows,
      rowHeights: heights,
      firstPageCapacity: 430,
      continuationPageCapacity: 430,
      footerHeight: 30,
      broughtForwardHeight: 30,
    });

    // first page 430 - 30 fits 4, later pages 430 - 30 - 30 fit 3
    expect(pages.map((page) => page.length)).toEqual([4, 3, 2]);
  });

  it("puts a short bill on one page", () => {
    const billRows = rows(2);
    const heights = new Map(billRows.map((row) => [row.key, 100]));
    const pages = paginateBillRows({
      rows: billRows, rowHeights: heights, firstPageCapacity: 400, continuationPageCapacity: 400, footerHeight: 30,
    });
    expect(pages.map((page) => page.length)).toEqual([2]);
  });
});
