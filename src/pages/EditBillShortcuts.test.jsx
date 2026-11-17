import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import BillEditorPage from "./BillEditorPage";

// a saved bill opened with Edit, like from the saved bills page
beforeEach(() => {
  localStorage.setItem("billmaster.preview.items", JSON.stringify([
    { id: "a", name: "Roller", rate: 350, per: "PC" },
    { id: "b", name: "Toner", rate: 900, per: "PC" },
  ]));
  localStorage.setItem("billmaster.preview.ledgers", JSON.stringify([{ id: "l1", name: "Siddarth" }]));
  localStorage.setItem("billmaster.preview.bills", JSON.stringify([{
    id: 1,
    companyName: "Siddarth",
    createdAt: "2026-11-17T09:00:00.000Z",
    previousAmount: 0,
    items: [
      { id: "r1", itemName: "Roller", quantity: 2, rate: 350, per: "PC", amount: 700 },
      { id: "r2", itemName: "Toner", quantity: 1, rate: 900, per: "PC", amount: 900 },
    ],
    charges: [],
  }]));
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

async function openSavedBillForEdit() {
  render(
    <MemoryRouter initialEntries={["/bills/1/edit"]}>
      <Routes>
        <Route path="/" element={<p>Landing page</p>} />
        <Route path="/bills/:id/edit" element={<BillEditorPage />} />
      </Routes>
    </MemoryRouter>,
  );
  return screen.findByLabelText("Item name 1");
}

describe("shortcuts on a saved bill opened with Edit", () => {
  it("Enter moves through the row and Backspace at the start goes back", async () => {
    const user = userEvent.setup();
    const name = await openSavedBillForEdit();
    name.focus();
    await user.keyboard("{Enter}");
    expect(document.activeElement).toBe(screen.getByLabelText("Quantity for item 1"));
    await user.keyboard("{Enter}");
    expect(document.activeElement).toBe(screen.getByLabelText("Rate for item 1"));
    await user.keyboard("{Enter}");
    expect(document.activeElement).toBe(screen.getByLabelText("Per for item 1"));
    await user.keyboard("{Enter}");
    expect(document.activeElement).toBe(screen.getByLabelText("Item name 2"));
    screen.getByLabelText("Per for item 1").focus();
    screen.getByLabelText("Per for item 1").setSelectionRange(0, 0);
    await user.keyboard("{Backspace}");
    expect(document.activeElement).toBe(screen.getByLabelText("Rate for item 1"));
  });

  it("typing at the start of a saved rate replaces it", async () => {
    const user = userEvent.setup();
    await openSavedBillForEdit();
    const quantity = screen.getByLabelText("Quantity for item 1");
    quantity.focus();
    await user.keyboard("{Enter}400");
    expect(screen.getByLabelText("Rate for item 1").value).toBe("400");
  });

  it("Alt+Enter alters the saved ledger", async () => {
    const user = userEvent.setup();
    await openSavedBillForEdit();
    screen.getByLabelText("Ledger name").focus();
    await user.keyboard("{Alt>}{Enter}{/Alt}");
    expect(await screen.findByRole("heading", { name: "Alter ledger" })).toBeTruthy();
  });

  it("Alt+Enter alters a saved item row, and Alt+Del can delete it", async () => {
    const user = userEvent.setup();
    const name = await openSavedBillForEdit();
    name.focus();
    await user.keyboard("{Alt>}{Enter}{/Alt}");
    expect(await screen.findByRole("heading", { name: "Alter item" })).toBeTruthy();
    await user.keyboard("{Alt>}{Delete}{/Alt}y");
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem("billmaster.preview.items")).map((item) => item.name)).toEqual(["Toner"]);
    });
  });

  it("Alt+C creates a new item into the row", async () => {
    const user = userEvent.setup();
    await openSavedBillForEdit();
    screen.getByLabelText("Item name 2").focus();
    await user.keyboard("{Alt>}c{/Alt}");
    expect(screen.getByRole("heading", { name: "Create item" })).toBeTruthy();
    await user.type(screen.getByLabelText("Item name", { selector: "#newItemName" }), "Drum{Enter}");
    await user.type(screen.getByLabelText("Rate"), "120{Enter}");
    await user.type(screen.getByLabelText("Per"), "PC{Enter}");
    expect(screen.getByLabelText("Item name 2").value).toBe("Drum");
    expect(screen.getByLabelText("Rate for item 2").value).toBe("120");
  });

  it("Tab adds a row, Enter on an empty name goes to charges, then previous amount and the print buttons", async () => {
    const user = userEvent.setup();
    await openSavedBillForEdit();
    screen.getByLabelText("Per for item 2").focus();
    await user.keyboard("{Tab}");
    expect(document.activeElement).toBe(screen.getByLabelText("Item name 3"));
    await user.keyboard("{Enter}");
    expect(document.activeElement).toBe(screen.getByLabelText("Charge name 1"));
    await user.keyboard("Delivery{Enter}50{Enter}");
    expect(document.activeElement).toBe(screen.getByLabelText("Charge name 2"));
    await user.keyboard("{Enter}");
    expect(document.activeElement).toBe(screen.getByLabelText("Previous amount"));
    await user.keyboard("{Enter}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /^Print$/ }));
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /Save & print/ }));
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /^Print$/ }));
  });

  it("Save & print updates the same saved bill instead of making a new one", async () => {
    const user = userEvent.setup();
    await openSavedBillForEdit();
    await user.click(screen.getByRole("button", { name: /Save & print/ }));
    await waitFor(() => {
      const bills = JSON.parse(localStorage.getItem("billmaster.preview.bills"));
      expect(bills).toHaveLength(1);
      expect(bills[0].id).toBe(1);
    });
  });

  it("Esc clears a box, Esc again asks to exit, y goes home", async () => {
    const user = userEvent.setup();
    await openSavedBillForEdit();
    const per = screen.getByLabelText("Per for item 1");
    per.focus();
    await user.keyboard("{Escape}");
    expect(per.value).toBe("");
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "Do you want to exit?" })).toBeTruthy();
    await user.keyboard("y");
    expect(await screen.findByText("Landing page")).toBeTruthy();
  });
});
