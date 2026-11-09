import { describe, expect, it } from "vitest";
import { extractItems } from "./itemImport";

describe("Excel item import", () => {
  it("reads every cell as a name when there are no rate or per columns", () => {
    const items = extractItems([
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

    expect(items.map((item) => item.name)).toEqual(["Cement", "Bricks", "Sand", "Steel", "Tiles", "Pipes"]);
    expect(items[0]).toEqual({ name: "Cement", rate: null, per: "" });
  });

  it("reads name, rate and per from header columns", () => {
    const items = extractItems([[
      ["Price List"],
      ["Sr", "Product", "Price", "Pc"],
      ["1", "Pen", "Rs. 1,250.50", "box"],
      ["2", "Pencil", "", ""],
      ["3", "", "10", "pc"],
    ]]);

    expect(items).toEqual([
      { name: "Pen", rate: 1250.5, per: "box" },
      { name: "Pencil", rate: null, per: "" },
    ]);
  });
});
