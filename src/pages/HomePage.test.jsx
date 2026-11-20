import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import HomePage from "./HomePage";

afterEach(cleanup);

function renderHome() {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<p>Opened page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("HomePage", () => {
  it("shows all six options in one place", () => {
    renderHome();
    expect(screen.getAllByRole("button")).toHaveLength(6);
    expect(screen.getByRole("button", { name: "Create new bill" })).toBeTruthy();
    ["Create challan", "View bills", "View challans", "Ledgers", "Items"].forEach((label) => {
      expect(screen.getByRole("button", { name: new RegExp(label) })).toBeTruthy();
    });
  });

  it("opens a page when a tile is clicked", async () => {
    renderHome();
    await userEvent.setup().click(screen.getByRole("button", { name: /View challans/ }));
    expect(screen.getByText("Opened page")).toBeTruthy();
  });

  it("esc asks before closing, n stays and y closes the app", async () => {
    const close = vi.spyOn(window, "close").mockImplementation(() => {});
    const user = userEvent.setup();
    renderHome();

    await user.keyboard("{Escape}");
    expect(screen.getByText("Do you want to exit?")).toBeTruthy();

    await user.keyboard("n");
    expect(screen.queryByText("Do you want to exit?")).toBeNull();
    expect(close).not.toHaveBeenCalled();

    await user.keyboard("{Escape}{ArrowRight}{Enter}");
    expect(close).toHaveBeenCalled();
    close.mockRestore();
  });
});
