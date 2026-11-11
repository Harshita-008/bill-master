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

  it("reads a sheet without headers by what the cells look like (tally stock summary)", () => {
    const items = extractItems([[
      ["071 CARTRIDGE", "550.00", "PC"],
      ["072 CARTRIDGE", "600", "PC"],
      ["100X140 125MIC JMD", "120.00", "PK"],
      ["BINDING SET", "", "SET"],
      ["", "", ""],
    ]]);

    expect(items).toEqual([
      { name: "071 CARTRIDGE", rate: 550, per: "PC" },
      { name: "072 CARTRIDGE", rate: 600, per: "PC" },
      { name: "100X140 125MIC JMD", rate: 120, per: "PK" },
      { name: "BINDING SET", rate: null, per: "SET" },
    ]);
  });

  it("never adds a cell that is only a rate or a unit as an item", () => {
    const items = extractItems([[
      ["Cement", "550.00", "PC"],
      ["100", "1000.00", "PK"],
    ], [
      ["Sand", "Rs. 120", "set"],
    ]]);

    expect(items.map((item) => item.name)).toEqual(["Cement", "Sand"]);
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
