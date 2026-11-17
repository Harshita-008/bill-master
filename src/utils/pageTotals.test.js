import { describe, expect, it } from "vitest";
import { pageTotals } from "./pageTotals";

const item = (amount) => ({ kind: "item", value: { amount } });

describe("page totals", () => {
  it("carries each page total forward to the next page", () => {
    const pages = [
      [item(100), item(200)],
      [item(50)],
      [item(25), { kind: "charge", value: { amount: 10 } }, { kind: "previous", value: -5 }],
    ];

    expect(pageTotals(pages)).toEqual([
      { broughtForward: 0, carriedForward: 300 },
      { broughtForward: 300, carriedForward: 350 },
      { broughtForward: 350, carriedForward: 380 },
    ]);
  });
});
