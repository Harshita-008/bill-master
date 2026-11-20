import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import ItemMasterPage from "./ItemMasterPage";
import BillForm from "../components/bill/BillForm";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const saveRoller = () => localStorage.setItem("billmaster.preview.items", JSON.stringify([
  { id: "a", name: "071 CARTRIDGE", rate: 350, per: "PC" },
]));
const savedCount = () => JSON.parse(localStorage.getItem("billmaster.preview.items")).length;

describe("item name already exists", () => {
  it("items page shows the error and keeps the typed name", async () => {
    saveRoller();
    const user = userEvent.setup();
    render(<MemoryRouter><ItemMasterPage /></MemoryRouter>);
    await screen.findByText("071 CARTRIDGE");
    const nameBox = screen.getByLabelText("Add an item manually");
    await user.type(nameBox, "071 cartridge");
    await user.click(screen.getByRole("button", { name: /Add item/ }));

    expect(await screen.findByText("Name already exists")).toBeTruthy();
    expect(savedCount()).toBe(1);
    await user.keyboard("{Enter}");
    expect(screen.queryByText("Name already exists")).toBeNull();
    expect(nameBox.value).toBe("071 cartridge");
    await waitFor(() => expect(document.activeElement).toBe(nameBox));
  });

  it("a new name is still added", async () => {
    saveRoller();
    const user = userEvent.setup();
    render(<MemoryRouter><ItemMasterPage /></MemoryRouter>);
    await screen.findByText("071 CARTRIDGE");
    await user.type(screen.getByLabelText("Add an item manually"), "072 CARTRIDGE");
    await user.click(screen.getByRole("button", { name: /Add item/ }));
    expect(await screen.findByText("072 CARTRIDGE")).toBeTruthy();
    expect(screen.queryByText("Name already exists")).toBeNull();
  });

  it("alt + c in the bill shows the error for a saved name", async () => {
    saveRoller();
    const user = userEvent.setup();
    render(<BillForm onBillChange={vi.fn()} />);
    screen.getByLabelText("Item name 1").focus();
    await user.keyboard("{Alt>}c{/Alt}");
    expect(screen.getByRole("heading", { name: "Create item" })).toBeTruthy();
    const dialogName = screen.getByLabelText("Item name");
    await user.clear(dialogName);
    await user.type(dialogName, "071 CARTRIDGE");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Name already exists. Enter a different name.")).toBeTruthy();
    expect(savedCount()).toBe(1);
  });
});
