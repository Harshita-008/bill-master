import { describe, expect, it } from "vitest";
import { extractItemNames } from "./itemImport";

describe("Excel item import", () => {
  it("collects names from every row, column, and worksheet while ignoring headers", () => {
    const names = extractItemNames([
      [
        ["Item Name", "Items"],
        ["Cement", "Bricks"],
        ["Sand", ""],
      ],
      [
        ["Name", "Steel"],
        ["Tiles", "Pipes"],
      ],
    ]);

    expect(names).toEqual(["Cement", "Bricks", "Sand", "Steel", "Tiles", "Pipes"]);
  });
});
