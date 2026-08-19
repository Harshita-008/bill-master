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

  it("searches saved ledgers from the first To cell in the right-side panel", async () => {
    localStorage.setItem("billmaster.preview.ledgers", JSON.stringify([
      { id: 2, name: "Zeta Traders" },
      { id: 1, name: "Alpha Stationers" },
    ]));
    const user = userEvent.setup();
    renderEditor();
    const ledgerInput = screen.getByLabelText("To line 1");

    await user.type(ledgerInput, "alp");
    const suggestionPanel = await screen.findByLabelText("Ledger search");
    expect(suggestionPanel.closest(".suggestion-rail")).toBeTruthy();
    expect(screen.getByRole("option", { name: "Alpha Stationers" })).toBeTruthy();

    await user.keyboard("{ArrowDown}{Enter}");
    expect(ledgerInput.value).toBe("Alpha Stationers");
    expect(document.activeElement).toBe(screen.getByLabelText("To line 2"));
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

  it("saves a returned print-only draft as a new challan even if the draft carried an old id", async () => {
    localStorage.setItem("billmaster.preview.challans", JSON.stringify([{
      id: 3,
      toLine1: "Existing challan",
      toLine2: "",
      toLine3: "",
      challanDate: "19/08/2026",
      boxCount: "1",
      deliveredBy: "Old",
    }]));
    sessionStorage.setItem("billmaster.challanEditorDraft", JSON.stringify({
      id: 3,
      toLine1: "Print-only challan",
      toLine2: "",
      toLine3: "",
      dateDay: "19",
      dateMonth: "8",
      dateYear: "2026",
      boxCount: "2",
      deliveredBy: "Ravi",
    }));
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={[{ pathname: "/challans/new", state: { fromPreview: true } }]}>
        <Routes>
          <Route path="/challans/new" element={<ChallanEditorPage />} />
          <Route path="/challan-print" element={<PrintRouteProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Save & print challan" }));
    expect(await screen.findByText("Challan print route")).toBeTruthy();
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem("billmaster.preview.challans"));
      expect(saved).toHaveLength(2);
      expect(saved[0]).toEqual(expect.objectContaining({ id: 4, toLine1: "Print-only challan" }));
      expect(saved[1]).toEqual(expect.objectContaining({ id: 3, toLine1: "Existing challan" }));
    });
  });
});
