import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import BillForm from "./BillForm";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("BillForm", () => {
  it("calculates item, charge, and grand totals while keeping values in the amount column", async () => {
    const user = userEvent.setup();
    const onBillChange = vi.fn();
    const { container } = render(React.createElement(BillForm, { onBillChange }));

    await user.type(screen.getByLabelText("Ledger name"), "Acme Traders");
    await user.type(screen.getByLabelText("Item name 1"), "Cement");
    await user.type(screen.getByLabelText("Rate for item 1"), "250");
    await user.clear(screen.getByLabelText("Quantity for item 1"));
    await user.type(screen.getByLabelText("Quantity for item 1"), "2");
    await user.type(screen.getByLabelText("Charge name 1"), "Delivery");
    await user.type(screen.getByLabelText("Charge amount 1"), "75");
    await user.type(screen.getByLabelText("Previous amount"), "100");

    expect(screen.getAllByText("₹500.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("₹75.00").length).toBeGreaterThan(0);
    expect(screen.getByText("₹675.00")).toBeTruthy();
    expect(container.querySelectorAll(".total-row > strong:nth-child(2)")).toHaveLength(2);
    expect(onBillChange).toHaveBeenLastCalledWith(expect.objectContaining({
      companyName: "Acme Traders",
      itemsTotal: 500,
      chargesTotal: 75,
      previousAmount: 100,
      grandTotal: 675,
    }));
  });

  it("keeps previous amount optional and accepts a signed decimal adjustment", async () => {
    const user = userEvent.setup();
    render(React.createElement(BillForm, { onBillChange: vi.fn() }));
    const previousAmount = screen.getByLabelText("Previous amount");

    expect(previousAmount.value).toBe("");
    await user.type(previousAmount, "-50.25");
    expect(previousAmount.value).toBe("-50.25");
    await user.keyboard("{Escape}");
    expect(previousAmount.value).toBe("");
  });

  it("subtracts negative charge and previous amounts from the bill total", async () => {
    const user = userEvent.setup();
    const onBillChange = vi.fn();
    render(React.createElement(BillForm, { onBillChange }));

    await user.type(screen.getByLabelText("Item name 1"), "Cement");
    await user.type(screen.getByLabelText("Quantity for item 1"), "2");
    await user.type(screen.getByLabelText("Rate for item 1"), "250");
    await user.type(screen.getByLabelText("Charge name 1"), "Discount");
    await user.type(screen.getByLabelText("Charge amount 1"), "-25.50");
    await user.type(screen.getByLabelText("Previous amount"), "-100");

    expect(onBillChange).toHaveBeenLastCalledWith(expect.objectContaining({
      itemsTotal: 500,
      chargesTotal: -25.5,
      previousAmount: -100,
      grandTotal: 374.5,
    }));
  });

  it("creates rows with Tab and moves from items to charges with Enter", async () => {
    const user = userEvent.setup();
    render(React.createElement(BillForm, { onBillChange: vi.fn() }));

    await user.type(screen.getByLabelText("Item name 1"), "Cement");
    const firstPer = screen.getByLabelText("Per for item 1");
    await user.click(firstPer);
    await user.keyboard("{Tab}");
    expect(screen.getAllByLabelText(/^Item name/)).toHaveLength(2);

    const secondPer = screen.getByLabelText("Per for item 2");
    await user.click(secondPer);
    await user.keyboard("{Enter}");
    expect(document.activeElement).toBe(screen.getByLabelText("Charge name 1"));

    await user.type(screen.getByLabelText("Charge name 1"), "Delivery");
    await user.click(screen.getByLabelText("Charge amount 1"));
    await user.keyboard("{Tab}");
    expect(screen.getAllByLabelText(/^Charge name/)).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Delete item row 2" }));
    await user.click(screen.getByRole("button", { name: "Delete charge row 2" }));
    expect(screen.getAllByLabelText(/^Item name/)).toHaveLength(1);
    expect(screen.getAllByLabelText(/^Charge name/)).toHaveLength(1);
  });

  it("reuses an existing empty next row instead of creating another row", async () => {
    const user = userEvent.setup();
    render(React.createElement(BillForm, { onBillChange: vi.fn() }));

    await user.type(screen.getByLabelText("Item name 1"), "Cement");
    await user.click(screen.getByLabelText("Per for item 1"));
    await user.keyboard("{Tab}");
    expect(screen.getAllByLabelText(/^Item name/)).toHaveLength(2);

    await user.click(screen.getByLabelText("Per for item 1"));
    await user.keyboard("{Enter}");
    expect(screen.getAllByLabelText(/^Item name/)).toHaveLength(2);
    expect(document.activeElement).toBe(screen.getByLabelText("Item name 2"));

    await user.type(screen.getByLabelText("Charge name 1"), "Delivery");
    await user.click(screen.getByLabelText("Charge amount 1"));
    await user.keyboard("{Tab}");
    expect(screen.getAllByLabelText(/^Charge name/)).toHaveLength(2);

    await user.click(screen.getByLabelText("Charge amount 1"));
    await user.keyboard("{Enter}");
    expect(screen.getAllByLabelText(/^Charge name/)).toHaveLength(2);
    expect(document.activeElement).toBe(screen.getByLabelText("Charge name 2"));
  });

  it("moves backward from charges through the empty item row before the filled row", async () => {
    const user = userEvent.setup();
    render(React.createElement(BillForm, { onBillChange: vi.fn() }));

    await user.type(screen.getByLabelText("Item name 1"), "Cement");
    await user.click(screen.getByLabelText("Per for item 1"));
    await user.keyboard("{Tab}");

    const emptyItemName = screen.getByLabelText("Item name 2");
    await user.click(screen.getByLabelText("Charge name 1"));
    await user.keyboard("{Backspace}");
    expect(document.activeElement).toBe(emptyItemName);

    await user.keyboard("{Backspace}");
    expect(document.activeElement).toBe(screen.getByLabelText("Per for item 1"));
  });

  it("moves backward from previous amount through the empty charge row before the filled row", async () => {
    const user = userEvent.setup();
    render(React.createElement(BillForm, { onBillChange: vi.fn() }));

    await user.type(screen.getByLabelText("Charge name 1"), "Delivery");
    await user.type(screen.getByLabelText("Charge amount 1"), "100");
    await user.keyboard("{Tab}");

    const emptyChargeName = screen.getByLabelText("Charge name 2");
    await user.click(screen.getByLabelText("Previous amount"));
    await user.keyboard("{Backspace}");
    expect(document.activeElement).toBe(emptyChargeName);

    await user.keyboard("{Backspace}");
    expect(document.activeElement).toBe(screen.getByLabelText("Charge amount 1"));
  });

  it("accepts only positive whole-number quantities", async () => {
    const user = userEvent.setup();
    render(React.createElement(BillForm, { onBillChange: vi.fn() }));
    const quantity = screen.getByLabelText("Quantity for item 1");

    expect(quantity.value).toBe("");
    await user.type(quantity, "3.5");
    expect(quantity.value).toBe("35");
    expect(quantity.inputMode).toBe("numeric");
  });

  it("moves backward at caret start and edits normally after Right Arrow", async () => {
    const user = userEvent.setup();
    render(React.createElement(BillForm, { onBillChange: vi.fn() }));
    const itemName = screen.getByLabelText("Item name 1");
    await user.type(itemName, "Cement");
    await user.keyboard("{Enter}");
    const quantity = screen.getByLabelText("Quantity for item 1");
    expect(document.activeElement).toBe(quantity);

    await user.keyboard("{Backspace}");
    expect(document.activeElement).toBe(itemName);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    itemName.setSelectionRange(1, 1);
    await user.keyboard("{Backspace}");
    expect(itemName.value).toBe("ement");
  });

  it("overwrites a previous bill cell when typing immediately after Backspace navigation", async () => {
    const user = userEvent.setup();
    render(React.createElement(BillForm, { onBillChange: vi.fn() }));
    const itemName = screen.getByLabelText("Item name 1");
    const quantity = screen.getByLabelText("Quantity for item 1");
    const rate = screen.getByLabelText("Rate for item 1");

    await user.type(itemName, "Cement{Enter}1{Enter}");
    expect(document.activeElement).toBe(rate);
    await user.keyboard("{Backspace}3");
    expect(quantity.value).toBe("3");

    quantity.setSelectionRange(0, 0);
    await user.keyboard("{Backspace}Drum");
    expect(itemName.value).toBe("Drum");
  });

  it("smoothly follows a newly created item row", async () => {
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    try {
      const user = userEvent.setup();
      render(React.createElement(BillForm, { onBillChange: vi.fn() }));

      await user.type(screen.getByLabelText("Item name 1"), "Cement");
      await user.click(screen.getByLabelText("Per for item 1"));
      await user.keyboard("{Tab}");

      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "nearest" });
      expect(document.activeElement).toBe(screen.getByLabelText("Item name 2"));
    } finally {
      if (originalScrollIntoView) Element.prototype.scrollIntoView = originalScrollIntoView;
      else delete Element.prototype.scrollIntoView;
    }
  });

  it("deletes selected item text normally instead of moving to the previous cell", async () => {
    const user = userEvent.setup();
    render(React.createElement(BillForm, { onBillChange: vi.fn() }));
    const itemName = screen.getByLabelText("Item name 1");

    await user.type(itemName, "12a Drum");
    await user.keyboard("{Control>}a{/Control}{Backspace}");

    expect(itemName.value).toBe("");
    expect(document.activeElement).toBe(itemName);
  });

  it("moves directly to charges when Enter is pressed on an empty item name", async () => {
    const user = userEvent.setup();
    render(React.createElement(BillForm, { onBillChange: vi.fn() }));

    const itemName = screen.getByLabelText("Item name 1");
    await user.click(itemName);
    await user.keyboard("{Enter}");

    expect(document.activeElement).toBe(screen.getByLabelText("Charge name 1"));
  });

  it("moves directly from an empty charge name to previous amount", async () => {
    const user = userEvent.setup();
    render(React.createElement(BillForm, { onBillChange: vi.fn() }));

    const chargeName = screen.getByLabelText("Charge name 1");
    await user.click(chargeName);
    await user.keyboard("{Enter}");

    expect(document.activeElement).toBe(screen.getByLabelText("Previous amount"));
  });

  it("opens a blank Alt+C ledger dialog and keeps the bill cell empty after saving", async () => {
    const user = userEvent.setup();
    render(React.createElement(BillForm, { onBillChange: vi.fn() }));

    await user.keyboard("{Alt>}c{/Alt}");
    expect(screen.getByRole("heading", { name: "Create ledger" })).toBeTruthy();
    const dialogInput = screen.getByLabelText("Ledger name", { selector: "#newLedgerName" });
    expect(dialogInput.value).toBe("");
    await user.type(dialogInput, "Harshita");
    await user.keyboard("{Enter}");

    expect(screen.queryByRole("heading", { name: "Create ledger" })).toBeNull();
    expect(screen.getByLabelText("Ledger name", { selector: "#ledgerName" }).value).toBe("");
    expect(JSON.parse(localStorage.getItem("billmaster.preview.ledgers"))[0].name).toBe("Harshita");
  });

  it("opens blank item creation with Alt+C and leaves the item cell empty", async () => {
    const user = userEvent.setup();
    render(React.createElement(BillForm, { onBillChange: vi.fn() }));

    const itemInput = screen.getByLabelText("Item name 1");
    await user.type(itemInput, "New Drum");
    await user.keyboard("{Alt>}c{/Alt}");

    expect(screen.getByRole("heading", { name: "Create item" })).toBeTruthy();
    const dialogInput = screen.getByLabelText("Item name", { selector: "#newItemName" });
    expect(dialogInput.value).toBe("");
    await user.type(dialogInput, "New Drum{Enter}");
    await user.type(screen.getByLabelText("Rate"), "80{Enter}");
    await user.type(screen.getByLabelText("Per"), "pc{Enter}");

    expect(itemInput.value).toBe("");
    const savedItems = JSON.parse(localStorage.getItem("billmaster.preview.items"));
    expect(savedItems.some((item) => item.name === "New Drum")).toBe(true);
    expect(savedItems[0]).toEqual(expect.objectContaining({ rate: 80, per: "pc" }));
  });

  it("fills saved rate and per when an item suggestion is selected", async () => {
    localStorage.setItem("billmaster.preview.items", JSON.stringify([
      { id: 1, name: "Saved Drum", rate: 175.5, per: "pkt" },
    ]));
    const user = userEvent.setup();
    render(React.createElement(BillForm, { onBillChange: vi.fn() }));

    await user.type(screen.getByLabelText("Item name 1"), "Saved");
    await screen.findByRole("option", { name: "Saved Drum" });
    await user.keyboard("{ArrowDown}{Enter}");

    expect(screen.getByLabelText("Rate for item 1").value).toBe("175.5");
    expect(screen.getByLabelText("Per for item 1").value).toBe("pkt");
    await user.clear(screen.getByLabelText("Rate for item 1"));
    await user.type(screen.getByLabelText("Rate for item 1"), "200");
    expect(screen.getByLabelText("Rate for item 1").value).toBe("200");
  });

  it("clears only the active bill cell when Escape is pressed", async () => {
    const user = userEvent.setup();
    render(React.createElement(BillForm, { onBillChange: vi.fn() }));

    const rate = screen.getByLabelText("Rate for item 1");
    await user.type(rate, "125");
    await user.keyboard("{Escape}");

    expect(rate.value).toBe("");
    expect(document.activeElement).toBe(rate);
  });
});
