import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import BillForm from "./BillForm";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const savedItems = () => JSON.parse(localStorage.getItem("billmaster.preview.items"));

// pick "Roller" in row 1 and open alter item with alt + enter
async function openAlterItem(user) {
  localStorage.setItem("billmaster.preview.items", JSON.stringify([
    { id: "a", name: "Roller", rate: 350, per: "PC" },
    { id: "b", name: "Toner", rate: 900, per: "PC" },
  ]));
  render(<BillForm onBillChange={vi.fn()} />);
  await user.type(screen.getByLabelText("Item name 1"), "Roller");
  await user.click(await screen.findByRole("option", { name: "Roller" }));
  screen.getByLabelText("Item name 1").focus();
  await user.keyboard("{Alt>}{Enter}{/Alt}");
  expect(screen.getByRole("heading", { name: "Alter item" })).toBeTruthy();
}

describe("delete an item from the bill", () => {
  it("alt + del asks first: n keeps the item, arrows + enter on yes deletes it", async () => {
    const user = userEvent.setup();
    await openAlterItem(user);

    await user.keyboard("{Alt>}{Delete}{/Alt}");
    expect(screen.getByText("Delete Roller?")).toBeTruthy();
    await user.keyboard("n");
    expect(screen.queryByText("Delete Roller?")).toBeNull();
    expect(savedItems()).toHaveLength(2);

    await user.keyboard("{Alt>}{Delete}{/Alt}");
    const [no, yes] = document.querySelectorAll(".confirm-dialog button");
    expect(document.activeElement).toBe(no);
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(yes);
    await user.keyboard("{Enter}");

    await waitFor(() => expect(savedItems().map((item) => item.name)).toEqual(["Toner"]));
    expect(screen.queryByRole("heading", { name: "Alter item" })).toBeNull();
    expect(screen.getByLabelText("Item name 1").value).toBe("");
    expect(screen.getByLabelText("Rate for item 1").value).toBe("");
    expect(screen.getByLabelText("Per for item 1").value).toBe("");
  });

  it("the delete button with y also deletes the item", async () => {
    const user = userEvent.setup();
    await openAlterItem(user);

    await user.click(screen.getByText("Delete"));
    await user.keyboard("y");
    await waitFor(() => expect(savedItems().map((item) => item.name)).toEqual(["Toner"]));
  });
});
