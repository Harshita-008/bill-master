import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import ItemMasterPage from "./ItemMasterPage";
import LedgerMasterPage from "./LedgerMasterPage";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("master pages", () => {
  it("adds an item with its saved rate and per values", async () => {
    const user = userEvent.setup();
    render(React.createElement(ItemMasterPage));

    const nameInput = screen.getByLabelText("Add an item manually");
    const rateInput = screen.getByLabelText("New item rate");
    const perInput = screen.getByLabelText("New item per");
    await user.type(nameInput, "New Bearing{Enter}");
    expect(document.activeElement).toBe(rateInput);
    await user.type(rateInput, "95.5{Enter}");
    expect(document.activeElement).toBe(perInput);
    await user.type(perInput, "pc{Enter}");

    expect(await screen.findByText("New Bearing")).toBeTruthy();
    expect(screen.getByText("95.50")).toBeTruthy();
    expect(screen.getByText("pc")).toBeTruthy();
    expect(document.activeElement).toBe(nameInput);
  });

  it("shows every saved item instead of stopping at 100", async () => {
    localStorage.setItem("billmaster.preview.items", JSON.stringify(Array.from(
      { length: 125 },
      (_, index) => ({ id: index + 1, name: `Item ${index + 1}` }),
    )));

    render(React.createElement(ItemMasterPage));

    expect(await screen.findByText("125 items")).toBeTruthy();
    const indexes = document.querySelectorAll(".item-index");
    expect(indexes[0].textContent).toBe("1");
    expect(indexes[1].textContent).toBe("2");
    expect(indexes[124].textContent).toBe("125");
  });

  it("deletes a ledger after in-app confirmation", async () => {
    localStorage.setItem("billmaster.preview.ledgers", JSON.stringify([
      { id: 1, name: "Harshita" },
      { id: 2, name: "Nanio" },
    ]));
    const user = userEvent.setup();

    render(React.createElement(LedgerMasterPage));
    await screen.findByText("2 saved ledgers");
    await user.click(screen.getByRole("button", { name: "Delete Harshita" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Delete ledger" }));

    await waitFor(() => expect(screen.queryByText("Harshita")).toBeNull());
    expect(screen.getByText("1 saved ledger")).toBeTruthy();
  });

  it("bulk deletes selected items only after confirmation", async () => {
    localStorage.setItem("billmaster.preview.items", JSON.stringify([
      { id: 1, name: "Item One", rate: 10, per: "pc" },
      { id: 2, name: "Item Two", rate: 20, per: "box" },
      { id: 3, name: "Item Three", rate: 30, per: "pkt" },
    ]));
    const user = userEvent.setup();

    render(React.createElement(ItemMasterPage));
    expect(screen.queryByLabelText("Select Item One")).toBeNull();
    await user.click(await screen.findByRole("button", { name: "Select items" }));
    await user.click(await screen.findByLabelText("Select Item One"));
    await user.click(screen.getByLabelText("Select Item Two"));
    await user.click(screen.getByRole("button", { name: "Delete selected" }));

    expect(screen.getByRole("heading", { name: "Delete 2 selected items?" })).toBeTruthy();
    await user.keyboard("{Delete}");

    await waitFor(() => expect(screen.queryByText("Item One")).toBeNull());
    expect(screen.queryByText("Item Two")).toBeNull();
    expect(screen.getByText("Item Three")).toBeTruthy();
  });

  it("edits multiple item names, rates, and units with keyboard navigation", async () => {
    localStorage.setItem("billmaster.preview.items", JSON.stringify([
      { id: 1, name: "Old Bearing", rate: 10, per: "pc" },
      { id: 2, name: "Second Item", rate: 20, per: "box" },
    ]));
    const user = userEvent.setup();

    render(React.createElement(ItemMasterPage));
    await user.click(await screen.findByRole("button", { name: "Multiple edit" }));

    const firstName = screen.getByLabelText("Item 1 name");
    const firstRate = screen.getByLabelText("Item 1 rate");
    const firstPer = screen.getByLabelText("Item 1 per");
    await user.click(firstName);
    await user.keyboard("{Escape}");
    expect(firstName.value).toBe("");
    await user.type(firstName, "New Bearing{Enter}");
    expect(document.activeElement).toBe(firstRate);
    await user.keyboard("{Escape}");
    await user.type(firstRate, "45.5{Enter}");
    expect(document.activeElement).toBe(firstPer);
    await user.keyboard("{Escape}");
    await user.type(firstPer, "pkt{Enter}");
    expect(document.activeElement).toBe(screen.getByLabelText("Item 2 name"));

    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("New Bearing")).toBeTruthy();
    expect(screen.getByText("45.50")).toBeTruthy();
    expect(screen.getByText("pkt")).toBeTruthy();
    const saved = JSON.parse(localStorage.getItem("billmaster.preview.items"));
    expect(saved[0]).toEqual(expect.objectContaining({ name: "New Bearing", rate: 45.5, per: "pkt" }));
  });

  it("selects all visible ledgers and bulk deletes them after confirmation", async () => {
    localStorage.setItem("billmaster.preview.ledgers", JSON.stringify([
      { id: 1, name: "Alpha" },
      { id: 2, name: "Beta" },
    ]));
    const user = userEvent.setup();

    render(React.createElement(LedgerMasterPage));
    await screen.findByText("2 saved ledgers");
    expect(screen.queryByLabelText("Select Alpha")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Select ledgers" }));
    await user.click(screen.getByRole("button", { name: "Select all" }));
    expect(screen.getByLabelText("Select Alpha").checked).toBe(true);
    expect(screen.getByLabelText("Select Beta").checked).toBe(true);
    await user.click(screen.getByRole("button", { name: "Delete selected" }));
    await user.click(screen.getByRole("button", { name: "Delete 2" }));

    expect(await screen.findByText("No ledgers saved yet")).toBeTruthy();
  });

  it("edits saved item and ledger names from their master lists", async () => {
    localStorage.setItem("billmaster.preview.items", JSON.stringify([
      { id: 1, name: "Old Item" },
    ]));
    localStorage.setItem("billmaster.preview.ledgers", JSON.stringify([
      { id: 2, name: "Old Ledger" },
    ]));
    const user = userEvent.setup();

    const itemPage = render(React.createElement(ItemMasterPage));
    await user.click(await screen.findByRole("button", { name: "Edit Old Item" }));
    const itemInput = screen.getByLabelText("Item name", { selector: "#newItemName" });
    await user.clear(itemInput);
    await user.type(itemInput, "New Item{Enter}");
    await user.type(screen.getByLabelText("Rate"), "45{Enter}");
    await user.type(screen.getByLabelText("Per"), "box{Enter}");
    expect(await screen.findByText("New Item")).toBeTruthy();
    expect(screen.getByText("45.00")).toBeTruthy();
    expect(screen.getByText("box")).toBeTruthy();
    itemPage.unmount();

    render(React.createElement(LedgerMasterPage));
    await user.click(await screen.findByRole("button", { name: "Edit Old Ledger" }));
    const ledgerInput = screen.getByLabelText("Ledger name", { selector: "#newLedgerName" });
    await user.clear(ledgerInput);
    await user.type(ledgerInput, "New Ledger{Enter}");
    expect(await screen.findByText("New Ledger")).toBeTruthy();
  });

  it("imports a sheet that adds new items and updates changed rates", async () => {
    localStorage.setItem("billmaster.preview.items", JSON.stringify([
      { id: 1, name: "Pen", rate: 5, per: "pc" },
      { id: 2, name: "Pencil", rate: 0, per: "" },
    ]));
    const user = userEvent.setup();
    const { container } = render(React.createElement(ItemMasterPage));
    await screen.findByText("Pen");

    const csv = "Item,Rate,Per\nPen,7,\nPencil,3,box\nEraser,2,pc\n";
    const file = new File([csv], "items.csv", { type: "text/csv" });
    // jsdom has no File.arrayBuffer
    file.arrayBuffer = async () => new TextEncoder().encode(csv).buffer;
    await user.upload(container.querySelector('input[type="file"]'), file);

    expect(await screen.findByText("1 new item added, 2 items updated, 0 unchanged.")).toBeTruthy();
    const saved = JSON.parse(localStorage.getItem("billmaster.preview.items"));
    expect(saved).toEqual([
      { id: 1, name: "Pen", rate: 7, per: "pc" },
      { id: 2, name: "Pencil", rate: 3, per: "box" },
      expect.objectContaining({ name: "Eraser", rate: 2, per: "pc" }),
    ]);
  });
});
