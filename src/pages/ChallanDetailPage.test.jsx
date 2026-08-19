import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import ChallanDetailPage from "./ChallanDetailPage";

vi.mock("../services/api", () => ({
  api: {
    getChallan: vi.fn(async () => ({
      id: 1,
      toLine1: "Acme",
      toLine2: "",
      toLine3: "",
      challanDate: "09/08/2026",
      boxCount: "2",
      deliveredBy: "Ravi",
    })),
    deleteChallan: vi.fn(async () => ({ deleted: true })),
  },
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
});

describe("ChallanDetailPage keyboard actions", () => {
  it("starts on Print and navigates Delete, Edit, and Print with arrow keys", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/challans/1"]}>
        <Routes>
          <Route path="/challans/1" element={<ChallanDetailPage />} />
          <Route path="/challan-print" element={<div>Challan print route</div>} />
          <Route path="/challans/1/edit" element={<div>Edit challan route</div>} />
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
    expect(screen.getByText("Challan print route")).toBeTruthy();
  });
});
