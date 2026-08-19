import { describe, expect, it } from "vitest";
import { prepareBill } from "./bill";

const makeBill = (previousAmount) => ({
  companyName: "Acme",
  items: [{ itemName: "Drum", quantity: "1", rate: "100", per: "pc" }],
  charges: [
    { name: "Delivery", amount: "25" },
    { name: "Discount", amount: "-10" },
  ],
  previousAmount,
});

describe("signed bill adjustments", () => {
  it("adds positive charge and previous amounts", () => {
    const bill = prepareBill(makeBill("20"));

    expect(bill.chargesTotal).toBe(15);
    expect(bill.previousAmount).toBe(20);
    expect(bill.grandTotal).toBe(135);
  });

  it("subtracts negative charge and previous amounts", () => {
    const bill = prepareBill(makeBill("-20"));

    expect(bill.chargesTotal).toBe(15);
    expect(bill.previousAmount).toBe(-20);
    expect(bill.grandTotal).toBe(95);
  });
});
