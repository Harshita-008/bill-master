import { describe, expect, it } from "vitest";
import { compactItemSearch, matchesItemSearch, searchItems } from "./item-search";

describe("compactItemSearch", () => {
  it("removes spaces so compact queries match spaced item names", () => {
    expect(compactItemSearch(" drum  101 ")).toBe("drum101");
    expect(compactItemSearch("Drum 101")).toBe("Drum101");
    expect(compactItemSearch("12A DRUM OEM").toLocaleLowerCase()).toContain(
      compactItemSearch("drumoem").toLocaleLowerCase(),
    );
    expect(compactItemSearch("071 DRUM").toLocaleLowerCase()).toContain(
      compactItemSearch("071drum").toLocaleLowerCase(),
    );
  });

  it("matches ordered item words even when other words occur between them", () => {
    expect(matchesItemSearch("47A ROLLER BLACK SPRING NEW", "rollerspring")).toBe(true);
    expect(matchesItemSearch("12A DRUM OEM", "drumoem")).toBe(true);
    expect(matchesItemSearch("071 DRUM", "071drum")).toBe(true);
    expect(matchesItemSearch("SPRING BLACK ROLLER", "rollrspring")).toBe(false);
  });
});

describe("search words in any order", () => {
  it("finds a name that has every typed word, in any order", () => {
    expect(matchesItemSearch("DRUM TEJU", "teju drum")).toBe(true);
    expect(matchesItemSearch("DRUM TEJU", "drum teju")).toBe(true);
    expect(matchesItemSearch("DRUM TEJU", "teju toner")).toBe(false);
  });

  it("finds joined words in any order too", () => {
    expect(matchesItemSearch("X5755 DRUM TEJU", "tejudrum")).toBe(true);
    expect(matchesItemSearch("X5755 DRUM TEJU", "tejudr")).toBe(true);
    expect(matchesItemSearch("12A TEJU TONER", "tejudrum")).toBe(false);
    expect(matchesItemSearch("071 DRUM", "drum")).toBe(true);
  });

  it("one joined word keeps the old a to z list on top, any order ones after", () => {
    const items = ["DRUM TEJU", "IR TEJU DRUM", "TEJU DRUM"].map((name) => ({ name }));
    expect(searchItems(items, "tejudrum").map((item) => item.name)).toEqual([
      "IR TEJU DRUM", "TEJU DRUM", "DRUM TEJU",
    ]);
  });

  it("lists the closest matches first: together, then in order, then any order", () => {
    const items = ["DRUM IR 2016", "HP IR DRUM", "IR 1400 DRUM", "IR DRUM", "TONER"].map((name) => ({ name }));
    expect(searchItems(items, "ir drum").map((item) => item.name)).toEqual([
      "HP IR DRUM", "IR DRUM", "IR 1400 DRUM", "DRUM IR 2016",
    ]);
  });

  it("keeps the a to z order for single word searches and for no search", () => {
    const items = ["071 DRUM", "DRUM 101", "IR DRUM", "TONER"].map((name) => ({ name }));
    expect(searchItems(items, "drum").map((item) => item.name)).toEqual(["071 DRUM", "DRUM 101", "IR DRUM"]);
    expect(searchItems(items, "")).toEqual(items);
  });
});
