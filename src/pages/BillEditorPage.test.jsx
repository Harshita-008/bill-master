import { cleanup, render, screen } from "@testing-library/react";
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
});
