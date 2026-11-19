import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import BillForm from "./BillForm";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const nameBox = (row) => screen.getByLabelText(`Item name ${row}`);

// pick "Roller" in row 1, then pick it again in row 2
async function enterRollerTwice(user) {
  localStorage.setItem("billmaster.preview.items", JSON.stringify([
    { id: "a", name: "Roller", rate: 350, per: "PC" },
    { id: "b", name: "Toner", rate: 900, per: "PC" },
  ]));
  render(<BillForm onBillChange={vi.fn()} />);
  await user.type(nameBox(1), "Roller");
  await user.click(await screen.findByRole("option", { name: "Roller" }));
  await user.type(screen.getByLabelText("Quantity for item 1"), "2{Enter}");
  await user.keyboard("{Enter}{Enter}");
  await waitFor(() => expect(document.activeElement).toBe(nameBox(2)));
  await user.keyboard("Roller");
  await user.click(await screen.findByRole("option", { name: "Roller" }));
  await screen.findByText("Duplicate entry");
}

describe("duplicate item warning", () => {
  it("shows yes, no and same entry with the s hint", async () => {
    const user = userEvent.setup();
    await enterRollerTwice(user);
    const buttons = [...document.querySelectorAll(".duplicate-dialog button")].map((button) => button.textContent);
    expect(buttons).toEqual(["No", "Yes", "Same entry"]);
    expect(screen.getByText(/S = go to the Same entry/)).toBeTruthy();
  });

  it("y keeps the item and goes to its quantity", async () => {
    const user = userEvent.setup();
    await enterRollerTwice(user);
    await user.keyboard("y");
    expect(screen.queryByText("Duplicate entry")).toBeNull();
    expect(nameBox(2).value).toBe("Roller");
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText("Quantity for item 2")));
  });

  it("n clears the typed item and stays on it", async () => {
    const user = userEvent.setup();
    await enterRollerTwice(user);
    await user.keyboard("n");
    expect(nameBox(2).value).toBe("");
    expect(screen.getByLabelText("Rate for item 2").value).toBe("");
    await waitFor(() => expect(document.activeElement).toBe(nameBox(2)));
  });

  it("s removes the new row and goes to quantity of the old entry", async () => {
    const user = userEvent.setup();
    await enterRollerTwice(user);
    await user.keyboard("s");
    expect(screen.queryByLabelText("Item name 2")).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText("Quantity for item 1")));
  });

  it("arrows + enter pick a button, other keys do nothing", async () => {
    const user = userEvent.setup();
    await enterRollerTwice(user);
    await user.keyboard("x{ArrowRight}{ArrowRight}");
    expect(document.activeElement.textContent).toBe("Same entry");
    await user.keyboard("{Enter}");
    expect(screen.queryByLabelText("Item name 2")).toBeNull();
  });

  it("does not warn for a different item", async () => {
    const user = userEvent.setup();
    localStorage.setItem("billmaster.preview.items", JSON.stringify([
      { id: "a", name: "Roller", rate: 350, per: "PC" },
      { id: "b", name: "Toner", rate: 900, per: "PC" },
    ]));
    render(<BillForm onBillChange={vi.fn()} />);
    await user.type(nameBox(1), "Roller");
    await user.click(await screen.findByRole("option", { name: "Roller" }));
    await user.keyboard("{Enter}{Enter}{Enter}");
    await waitFor(() => expect(document.activeElement).toBe(nameBox(2)));
    await user.keyboard("Toner");
    await user.click(await screen.findByRole("option", { name: "Toner" }));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText("Quantity for item 2")));
    expect(screen.queryByText("Duplicate entry")).toBeNull();
  });
});
