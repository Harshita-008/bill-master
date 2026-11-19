import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import ItemMasterPage from "./ItemMasterPage";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("items page search", () => {
  it("finds words in any order, like the bill", async () => {
    localStorage.setItem("billmaster.preview.items", JSON.stringify([
      { id: "a", name: "X5755 DRUM TEJU", rate: 0, per: "" },
      { id: "b", name: "12A TEJU TONER", rate: 0, per: "" },
    ]));
    const user = userEvent.setup();
    render(<MemoryRouter><ItemMasterPage /></MemoryRouter>);
    await screen.findByText("X5755 DRUM TEJU");
    await user.type(screen.getByPlaceholderText("Search saved items"), "teju drum");
    expect(screen.getByText("X5755 DRUM TEJU")).toBeTruthy();
    expect(screen.queryByText("12A TEJU TONER")).toBeNull();
  });
});
