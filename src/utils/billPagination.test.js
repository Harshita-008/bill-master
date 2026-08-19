import { describe, expect, it } from "vitest";
import { paginateBillRows } from "./billPagination";

function rows(count) {
  return Array.from({ length: count }, (_, index) => ({ key: `row-${index}` }));
}

describe("paginateBillRows", () => {
  it("continues overflowing rows on additional fixed-capacity pages", () => {
    const billRows = rows(12);
    const heights = new Map(billRows.map((row) => [row.key, 100]));

    const pages = paginateBillRows({
      rows: billRows,
      rowHeights: heights,
      firstPageCapacity: 410,
      continuationPageCapacity: 470,
      footerHeight: 30,
    });

    expect(pages.map((page) => page.length)).toEqual([4, 4, 4]);
    expect(pages.flat().map((row) => row.key)).toEqual(billRows.map((row) => row.key));
  });

  it("adds a final page when the total does not fit below the last row", () => {
    const billRows = rows(2);
    const heights = new Map(billRows.map((row) => [row.key, 100]));

    const pages = paginateBillRows({
      rows: billRows,
      rowHeights: heights,
      firstPageCapacity: 200,
      continuationPageCapacity: 200,
      footerHeight: 30,
    });

    expect(pages.map((page) => page.length)).toEqual([1, 1]);
  });
});
