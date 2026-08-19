import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import ChallanHistoryPage from "./ChallanHistoryPage";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("ChallanHistoryPage keyboard navigation", () => {
  it("focuses the first challan and opens the highlighted row with Enter", async () => {
    localStorage.setItem("billmaster.preview.challans", JSON.stringify([
      { id: 1, toLine1: "Acme", challanDate: "08/08/2026", createdAt: "2026-08-08T10:00:00Z" },
      { id: 2, toLine1: "Beta", challanDate: "09/08/2026", createdAt: "2026-08-09T10:00:00Z" },
    ]));
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/challans"]}>
        <Routes>
          <Route path="/challans" element={<ChallanHistoryPage />} />
          <Route path="/challans/:id" element={<div>Selected challan route</div>} />
        </Routes>
      </MemoryRouter>,
    );

    const rows = await waitFor(() => {
      const matches = [...document.querySelectorAll(".challan-list-row")];
      expect(matches).toHaveLength(2);
      return matches;
    });
    await waitFor(() => expect(document.activeElement).toBe(rows[0]));
    expect(rows[0].textContent).toContain("Beta");
    expect(rows[1].textContent).toContain("Acme");
    expect(screen.queryByText("Challan")).toBeNull();
    expect(document.body.textContent).not.toContain("#000");

    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(rows[1]);
    await user.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(rows[0]);
    await user.keyboard("{Enter}");
    expect(screen.getByText("Selected challan route")).toBeTruthy();
  });
});
