import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import BillsHistoryPage from "./BillsHistoryPage";
import CompanyBillsPage from "./CompanyBillsPage";

const bills = [
  { id: 3, companyName: "Beta", createdAt: "2026-08-10T10:00:00Z", itemsTotal: 30, chargesTotal: 0, grandTotal: 30 },
  { id: 2, companyName: "Acme", createdAt: "2026-08-09T10:00:00Z", itemsTotal: 20, chargesTotal: 0, grandTotal: 20 },
  { id: 1, companyName: "Acme", createdAt: "2026-08-08T10:00:00Z", itemsTotal: 10, chargesTotal: 0, grandTotal: 10 },
];

function SelectedBillProbe() {
  const location = useLocation();
  return (
    <div>
      <span>Selected bill route</span>
      <span data-testid="bill-return-to">{location.state?.returnTo}</span>
    </div>
  );
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("saved bill keyboard navigation", () => {
  it("highlights the first ledger and opens the arrow-selected ledger with Enter", async () => {
    localStorage.setItem("billmaster.preview.bills", JSON.stringify(bills));
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/bills"]}>
        <Routes>
          <Route path="/bills" element={<BillsHistoryPage />} />
          <Route path="/bills/company/:companyName" element={<div>Selected ledger route</div>} />
        </Routes>
      </MemoryRouter>,
    );

    const rows = await waitFor(() => {
      const matches = [...document.querySelectorAll(".company-list-row")];
      expect(matches).toHaveLength(2);
      return matches;
    });
    await waitFor(() => expect(document.activeElement).toBe(rows[0]));

    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(rows[1]);
    await user.keyboard("{Enter}");
    expect(screen.getByText("Selected ledger route")).toBeTruthy();
  });

  it("highlights the latest bill and opens the arrow-selected bill with Enter", async () => {
    localStorage.setItem("billmaster.preview.bills", JSON.stringify([bills[2], bills[0], bills[1]]));
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/bills/company/Acme"]}>
        <Routes>
          <Route path="/bills/company/:companyName" element={<CompanyBillsPage />} />
          <Route path="/bills/:id" element={<SelectedBillProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    const rows = await waitFor(() => {
      const matches = [...document.querySelectorAll(".company-bill-row")];
      expect(matches).toHaveLength(2);
      return matches;
    });
    await waitFor(() => expect(document.activeElement).toBe(rows[0]));
    expect(rows[0].textContent).toContain("20.00");
    expect(rows[1].textContent).toContain("10.00");

    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(rows[1]);
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(rows[1]);
    await user.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(rows[0]);
    await user.keyboard("{Enter}");
    expect(screen.getByText("Selected bill route")).toBeTruthy();
    expect(screen.getByTestId("bill-return-to").textContent).toBe("/bills/company/Acme");
  });
});
