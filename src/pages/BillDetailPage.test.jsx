import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import BillDetailPage from "./BillDetailPage";
import { api } from "../services/api";

vi.mock("../services/api", () => ({
  api: {
    getBill: vi.fn(async () => ({
      id: 5,
      companyName: "NDC",
      createdAt: "2026-08-10T10:00:00Z",
      items: [],
      charges: [],
      grandTotal: 0,
    })),
    deleteBill: vi.fn(async () => ({ deleted: true })),
    updateBillItemMark: vi.fn(async (_, __, isMarked) => ({ updated: true, isMarked })),
  },
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
});

describe("BillDetailPage keyboard actions", () => {
  it("starts on Print and navigates Delete, Edit, and Print with arrow keys", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/bills/5"]}>
        <Routes>
          <Route path="/bills/5" element={<BillDetailPage />} />
          <Route path="/print" element={<div>Bill print route</div>} />
          <Route path="/bills/5/edit" element={<div>Edit bill route</div>} />
        </Routes>
      </MemoryRouter>,
    );

    const printButton = await screen.findByRole("button", { name: "Print" });
    const editButton = screen.getByRole("button", { name: "Edit" });
    const deleteButton = screen.getByRole("button", { name: "Delete" });
    await waitFor(() => expect(document.activeElement).toBe(printButton));

    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(editButton);
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(deleteButton);
    await user.keyboard("{ArrowRight}{ArrowRight}{Enter}");
    expect(screen.getByText("Bill print route")).toBeTruthy();
  });

  it("shows a long saved bill as separate scrollable pages", async () => {
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function getHeight() {
      if (this.classList?.contains("simple-document-header")) return 50;
      if (this.tagName === "THEAD") return 30;
      if (this.tagName === "TFOOT") return 30;
      if (this.hasAttribute?.("data-bill-row")) return 100;
      return 0;
    });
    api.getBill.mockResolvedValueOnce({
      id: 5,
      companyName: "NDC",
      createdAt: "2026-08-10T10:00:00Z",
      items: Array.from({ length: 20 }, (_, index) => ({
        id: index + 1,
        itemName: `Item ${index + 1}`,
        quantity: 1,
        per: "pc",
        rate: 10,
        amount: 10,
      })),
      charges: [],
      grandTotal: 200,
    });

    render(
      <MemoryRouter initialEntries={["/bills/5"]}>
        <Routes><Route path="/bills/5" element={<BillDetailPage />} /></Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("region", { name: "Scrollable saved bill" })).toBeTruthy();
    await waitFor(() => {
      expect(screen.getAllByRole("article", { name: /Bill page/ })).toHaveLength(3);
    });
  });

  it("persists each saved item row toggle and switches it back to black", async () => {
    api.getBill.mockResolvedValueOnce({
      id: 5,
      companyName: "NDC",
      createdAt: "2026-08-10T10:00:00Z",
      items: [{
        id: 12,
        itemName: "Drum",
        quantity: 1,
        per: "pc",
        rate: 10,
        amount: 10,
        isMarked: false,
      }],
      charges: [],
      grandTotal: 10,
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/bills/5"]}>
        <Routes><Route path="/bills/5" element={<BillDetailPage />} /></Routes>
      </MemoryRouter>,
    );

    const toggle = await screen.findByRole("switch", { name: "Toggle red row for Drum" });
    await user.click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    expect(toggle.closest("tr")?.classList.contains("saved-item-marked")).toBe(true);
    expect(api.updateBillItemMark).toHaveBeenLastCalledWith(5, 12, true);

    await user.click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(toggle.closest("tr")?.classList.contains("saved-item-marked")).toBe(false);
    expect(api.updateBillItemMark).toHaveBeenLastCalledWith(5, 12, false);
  });
});
