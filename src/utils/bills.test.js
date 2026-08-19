import { describe, expect, it } from "vitest";
import { groupBillsByCompany, newestFirst } from "./bills";

describe("bill company grouping", () => {
  const bills = [
    { id: 1, companyName: "Acme", grandTotal: 100, createdAt: "2026-07-25T10:00:00Z" },
    { id: 2, companyName: "  acme  ", grandTotal: 250, createdAt: "2026-07-29T10:00:00Z" },
    { id: 3, companyName: "Beta", grandTotal: 75, createdAt: "2026-07-28T10:00:00Z" },
  ];

  it("groups company names case-insensitively and orders companies alphabetically", () => {
    const groups = groupBillsByCompany(bills);
    expect(groups).toHaveLength(2);
    expect(groups[0].companyName).toBe("acme");
    expect(groups[0].bills).toHaveLength(2);
    expect(groups[0].total).toBe(350);
    expect(groups[1].companyName).toBe("Beta");
  });

  it("orders a company's bills newest first", () => {
    expect([...bills].sort(newestFirst).map((bill) => bill.id)).toEqual([2, 3, 1]);
  });
});
