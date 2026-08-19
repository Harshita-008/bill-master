import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import ChallanEditorPage from "./ChallanEditorPage";

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

function PrintRouteProbe() {
  const location = useLocation();
  return (
    <div>
      Challan print route
      <span data-testid="return-to">{location.state?.returnTo}</span>
    </div>
  );
}

function renderEditor() {
  return render(
    <MemoryRouter initialEntries={["/challans/new"]}>
      <Routes>
        <Route path="/challans/new" element={<ChallanEditorPage />} />
        <Route path="/challan-print" element={<PrintRouteProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ChallanEditorPage", () => {
  it("focuses the first To cell when a new challan opens", () => {
    renderEditor();

    expect(document.activeElement).toBe(screen.getByLabelText("To line 1"));
  });

  it("moves from By to the challan actions and navigates them with arrow keys", async () => {
    const user = userEvent.setup();
    renderEditor();
    const deliveredBy = screen.getByLabelText("Delivered by");
    const printButton = screen.getByRole("button", { name: "Print challan" });
    const saveButton = screen.getByRole("button", { name: "Save & print challan" });

    await user.type(deliveredBy, "Ravi{Enter}");
    expect(document.activeElement).toBe(printButton);

    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(saveButton);

    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(printButton);
  });

  it("prints without saving when Print challan is used", async () => {
    const user = userEvent.setup();
    renderEditor();
    await user.type(screen.getByLabelText("Number of boxes"), "3");
    await user.click(screen.getByRole("button", { name: "Print challan" }));

    expect(await screen.findByText("Challan print route")).toBeTruthy();
    expect(localStorage.getItem("billmaster.preview.challans")).toBeNull();
    expect(JSON.parse(sessionStorage.getItem("billmaster.challanPrintDraft")).boxCount).toBe("3");
  });

  it("saves before opening print preview when Save & print challan is used", async () => {
    const user = userEvent.setup();
    renderEditor();
    await user.type(screen.getByLabelText("To line 1"), "Acme Traders");
    await user.type(screen.getByLabelText("Delivered by"), "Ravi");
    await user.click(screen.getByRole("button", { name: "Save & print challan" }));

    expect(await screen.findByText("Challan print route")).toBeTruthy();
    expect(screen.getByTestId("return-to").textContent).toBe("/challans/new");
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem("billmaster.preview.challans"));
      expect(saved).toHaveLength(1);
      expect(saved[0]).toEqual(expect.objectContaining({ toLine1: "Acme Traders", deliveredBy: "Ravi" }));
    });
  });
});
