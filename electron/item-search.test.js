import { describe, expect, it } from "vitest";
import { compactItemSearch, matchesItemSearch } from "./item-search";

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
    expect(matchesItemSearch("SPRING BLACK ROLLER", "rollerspring")).toBe(false);
  });
});
