import { describe, expect, it } from "vitest";
import { combineImportedItems, mergeItem } from "./item-merge.js";

describe("item import merge", () => {
  it("overrides changed values and fills blank ones", () => {
    expect(mergeItem({ rate: 10, per: "pc" }, { rate: 12, per: "box" })).toEqual({ rate: 12, per: "box" });
    expect(mergeItem({ rate: 0, per: "" }, { rate: 5, per: "pc" })).toEqual({ rate: 5, per: "pc" });
  });

  it("keeps saved values when the file cell is blank or the same", () => {
    expect(mergeItem({ rate: 10, per: "pc" }, { rate: null, per: "" })).toBeNull();
    expect(mergeItem({ rate: 10, per: "pc" }, { rate: 10, per: "pc" })).toBeNull();
    expect(mergeItem({ rate: 10, per: "pc" }, { rate: null, per: "box" })).toEqual({ rate: 10, per: "box" });
  });

  it("combines repeated names in one file", () => {
    expect(combineImportedItems([
      { name: "Pen", rate: 5, per: "pc" },
      { name: "pen", rate: null, per: "box" },
    ])).toEqual([{ name: "Pen", rate: 5, per: "box" }]);
  });
});
