import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import BillDetailPage from "./BillDetailPage";

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
});
