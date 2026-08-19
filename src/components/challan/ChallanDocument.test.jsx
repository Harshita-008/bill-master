import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import ChallanDocument from "./ChallanDocument";

afterEach(cleanup);

describe("ChallanDocument", () => {
  it("renders the requested challan wording and filled values", () => {
    const { container } = render(React.createElement(ChallanDocument, {
      challan: {
        toLine1: "Acme Traders",
        toLine2: "Main Road",
        toLine3: "Mumbai",
        challanDate: "04/08/2026",
        boxCount: "6",
        deliveredBy: "Ravi",
      },
    }));

    expect(screen.getByText("To,")).toBeTruthy();
    expect(screen.getByText("Acme Traders")).toBeTruthy();
    expect(screen.getByText("04/08/2026")).toBeTruthy();
    expect(container.querySelector(".challan-document-statement")?.textContent).toContain("6 BOX STATIONARY GOODS");
    expect(screen.getByText(/By,/)).toBeTruthy();
    expect(screen.getByText("Ravi")).toBeTruthy();
    expect(container.querySelector(".challan-document-statement span")?.textContent).toBe("6");
    const recipient = container.querySelector(".challan-document-recipient");
    expect(recipient?.querySelector("strong")?.textContent).toBe("To,");
    expect(recipient?.querySelector(".challan-document-to > div")?.textContent).toBe("Acme Traders");
    expect(container.querySelector(".challan-document")?.style.getPropertyValue("--challan-line-size")).toBe("1em");
  });

  it("reduces recipient text size when a line is unusually long", () => {
    const { container } = render(React.createElement(ChallanDocument, {
      challan: {
        toLine1: "A very long recipient line that must remain inside the printable A6 page without overflowing",
        toLine2: "",
        toLine3: "",
        challanDate: "06/08/2026",
        boxCount: "2",
        deliveredBy: "Ravi",
      },
    }));

    expect(container.querySelector(".challan-document")?.style.getPropertyValue("--challan-line-size")).toBe("0.72em");
  });
});
