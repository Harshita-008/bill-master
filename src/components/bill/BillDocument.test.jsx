import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import BillDocument from "./BillDocument";

afterEach(cleanup);

describe("BillDocument", () => {
  it("renders only the minimal invoice content with a date and Per column", () => {
    const { container } = render(React.createElement(BillDocument, {
      bill: {
        id: 44,
        companyName: "Acme Traders",
        createdAt: "2026-07-29T17:30:00.000Z",
        items: [{
          id: 1,
          itemName: "Cement",
          quantity: 2,
          per: "pkt",
          rate: 250,
          amount: 500,
        }],
        charges: [],
        previousAmount: -100,
        grandTotal: 400,
      },
    }));

    expect(screen.getByRole("heading", { name: "Acme Traders" })).toBeTruthy();
    expect(screen.getByText("29/07/2026")).toBeTruthy();
    expect(screen.getByText("Per")).toBeTruthy();
    expect(screen.getByText("pkt")).toBeTruthy();
    expect(screen.getAllByText("250.00").length).toBeGreaterThan(0);
    expect(screen.queryByText("₹250.00")).toBeNull();
    expect(screen.getByText("Total").className).toBe("invoice-total-label");
    expect(screen.getByText("Previous amount")).toBeTruthy();
    expect(screen.getByText("-100.00")).toBeTruthy();
    expect(container.querySelector(".invoice-total-value")?.textContent).toBe("400.00");
    expect(screen.queryByText(/invoice/i)).toBeNull();
    expect(screen.queryByText(/bill no/i)).toBeNull();
    expect(screen.queryByText(/thank you/i)).toBeNull();
    expect(screen.queryByRole("switch")).toBeNull();
  });

  it("omits the previous amount row when no adjustment was entered", () => {
    render(React.createElement(BillDocument, {
      bill: {
        companyName: "Acme Traders",
        items: [],
        charges: [],
        previousAmount: 0,
        grandTotal: 0,
      },
    }));

    expect(screen.queryByText("Previous amount")).toBeNull();
  });

  it("prints a positive previous amount without a negative sign", () => {
    const { container } = render(React.createElement(BillDocument, {
      bill: {
        companyName: "Acme Traders",
        items: [],
        charges: [],
        previousAmount: 100,
        grandTotal: 100,
      },
    }));

    expect(screen.getByText("Previous amount")).toBeTruthy();
    expect(container.querySelector(".invoice-adjustment-value")?.textContent).toBe("100.00");
    expect(screen.queryByText("-100.00")).toBeNull();
  });

  it("shows brought forward at the top and carried forward at the bottom of a middle page", () => {
    const { container } = render(React.createElement(BillDocument, {
      bill: { companyName: "Acme", items: [], charges: [], grandTotal: 900 },
      rows: [{ kind: "item", key: "a", value: { itemName: "Pen", quantity: 1, per: "pc", rate: 50, amount: 50 } }],
      showHeader: false,
      showFooter: false,
      broughtForward: 300,
      carriedForward: 350,
    }));

    const lines = [...container.querySelectorAll("tr")].map((row) => row.textContent);
    expect(lines[1]).toBe("Brought forward300.00");
    expect(lines.at(-1)).toBe("Carried forward350.00");
    expect(screen.queryByText("Total")).toBeNull();
  });
});
