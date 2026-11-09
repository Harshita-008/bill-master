import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import BillEditorPage from "./BillEditorPage";

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  localStorage.clear();
});

describe("BillEditorPage", () => {
  it("restores the complete print draft when returning from preview", async () => {
    sessionStorage.setItem("billmaster.editorDraft", JSON.stringify({
      companyName: "Unsaved Ledger",
      items: [{
        itemName: "Saved Draft Item",
        quantity: 3,
        rate: 25,
        per: "pc",
        amount: 75,
      }, {
        itemName: "",
        quantity: 1,
        rate: "",
        per: "",
        amount: 0,
      }],
      charges: [{ name: "Delivery", amount: 10 }],
    }));

    render(
      <MemoryRouter initialEntries={[{ pathname: "/bills/new", state: { fromPreview: true } }]}>
        <Routes>
          <Route path="/bills/new" element={<BillEditorPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("Ledger name").value).toBe("Unsaved Ledger");
    expect(screen.getByLabelText("Item name 1").value).toBe("Saved Draft Item");
    expect(screen.getByLabelText("Quantity for item 1").value).toBe("3");
    expect(screen.getByLabelText("Rate for item 1").value).toBe("25");
    expect(screen.getByLabelText("Per for item 1").value).toBe("pc");
    expect(screen.getByLabelText("Charge name 1").value).toBe("Delivery");
    expect(screen.getAllByLabelText(/^Item name/)).toHaveLength(2);
  });

  it("saves and prints a bill with blank quantity and rate", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/bills/new"]}>
        <Routes>
          <Route path="/bills/new" element={<BillEditorPage />} />
          <Route path="/print" element={<p>Print page</p>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Ledger name"), "Blank Ledger");
    await user.type(screen.getByLabelText("Item name 1"), "Pen");
    await user.click(screen.getByRole("button", { name: /Save & print/ }));

    expect(await screen.findByText("Print page")).toBeTruthy();
    const [saved] = JSON.parse(localStorage.getItem("billmaster.preview.bills"));
    expect(saved.items[0]).toMatchObject({ itemName: "Pen", quantity: 0, rate: 0, amount: 0 });
  });

  it("starts a completely fresh bill from the editor header action", async () => {
    sessionStorage.setItem("billmaster.editorDraft", JSON.stringify({
      companyName: "Existing Draft",
      items: [{ itemName: "Drum", quantity: 2, rate: 50, per: "pc", amount: 100 }],
      charges: [{ name: "Delivery", amount: 10 }],
    }));
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={[{ pathname: "/bills/new", state: { fromPreview: true } }]}>
        <Routes>
          <Route path="/bills/new" element={<BillEditorPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("Ledger name").value).toBe("Existing Draft");
    await user.click(screen.getByRole("button", { name: "New bill" }));

    expect(screen.getByLabelText("Ledger name").value).toBe("");
    expect(screen.getAllByLabelText(/^Item name/)).toHaveLength(1);
    expect(screen.getByLabelText("Item name 1").value).toBe("");
    expect(sessionStorage.getItem("billmaster.editorDraft")).toBeNull();
    expect(sessionStorage.getItem("billmaster.printDraft")).toBeNull();
  });

  it("saves a returned print-only draft as a new bill even if the draft carried an old id", async () => {
    localStorage.setItem("billmaster.preview.bills", JSON.stringify([{
      id: 4,
      companyName: "Existing ledger",
      items: [{ itemName: "Existing item", quantity: 1, rate: 10, per: "pc", amount: 10 }],
      charges: [],
      grandTotal: 10,
    }]));
    sessionStorage.setItem("billmaster.editorDraft", JSON.stringify({
      id: 4,
      companyName: "Print-only ledger",
      items: [{ itemName: "New item", quantity: 2, rate: 25, per: "pc", amount: 50 }],
      charges: [{ name: "", amount: "" }],
      previousAmount: "",
    }));
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={[{ pathname: "/bills/new", state: { fromPreview: true } }]}>
        <Routes>
          <Route path="/bills/new" element={<BillEditorPage />} />
          <Route path="/print" element={<div>Bill print route</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Save & print" }));
    expect(await screen.findByText("Bill print route")).toBeTruthy();
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem("billmaster.preview.bills"));
      expect(saved).toHaveLength(2);
      expect(saved[0]).toEqual(expect.objectContaining({ id: 5, companyName: "Print-only ledger" }));
      expect(saved[1]).toEqual(expect.objectContaining({ id: 4, companyName: "Existing ledger" }));
    });
  });
});
