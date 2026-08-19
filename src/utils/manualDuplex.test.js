import { describe, expect, it } from "vitest";
import { getManualDuplexPageRanges, getPhysicalSheetCount } from "./manualDuplex";

describe("manual duplex printing", () => {
  it("creates zero-based ranges for odd and even physical page numbers", () => {
    expect(getManualDuplexPageRanges(5, "front")).toEqual([
      { from: 0, to: 0 },
      { from: 2, to: 2 },
      { from: 4, to: 4 },
    ]);
    expect(getManualDuplexPageRanges(5, "back")).toEqual([
      { from: 1, to: 1 },
      { from: 3, to: 3 },
    ]);
  });

  it("calculates physical sheets after applying the copy count", () => {
    expect(getPhysicalSheetCount(2, 2, false)).toBe(4);
    expect(getPhysicalSheetCount(2, 2, true)).toBe(2);
    expect(getPhysicalSheetCount(5, 3, true)).toBe(9);
  });
});
