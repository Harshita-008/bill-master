import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import LedgerAutocomplete from "./LedgerAutocomplete";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function LedgerHarness() {
  const [value, setValue] = React.useState("");
  return React.createElement(LedgerAutocomplete, {
    value,
    onChange: setValue,
    inputRef: { current: null },
    onEnter: vi.fn(),
  });
}

describe("LedgerAutocomplete", () => {
  it("stays closed when empty, then shows sorted case-insensitive matches", async () => {
    localStorage.setItem("billmaster.preview.ledgers", JSON.stringify([
      { id: 2, name: "Zeta" },
      { id: 1, name: "Alpha" },
    ]));
    const user = userEvent.setup();
    render(React.createElement(LedgerHarness));
    const input = screen.getByRole("combobox");

    await user.click(input);
    expect(screen.queryByRole("listbox")).toBeNull();
    await user.type(input, "a");
    const options = await screen.findAllByRole("option");
    expect(options.map((option) => option.getAttribute("aria-label"))).toEqual(["Alpha", "Zeta"]);
  });

  it("keeps a typed unsaved ledger when Enter is pressed without choosing a suggestion", async () => {
    localStorage.setItem("billmaster.preview.ledgers", JSON.stringify([
      { id: 1, name: "Alpha Traders" },
    ]));
    const user = userEvent.setup();
    const onEnter = vi.fn();

    function FreeTextHarness() {
      const [value, setValue] = React.useState("");
      return React.createElement(LedgerAutocomplete, {
        value,
        onChange: setValue,
        inputRef: { current: null },
        onEnter,
      });
    }

    render(React.createElement(FreeTextHarness));
    const input = screen.getByRole("combobox");
    await user.type(input, "Alpha");
    await screen.findByRole("option", { name: "Alpha Traders" });
    await user.keyboard("{Enter}");

    expect(input.value).toBe("Alpha");
    expect(onEnter).toHaveBeenCalledOnce();
  });

  it("does not show a dropdown message when an unsaved ledger has no matches", async () => {
    localStorage.setItem("billmaster.preview.ledgers", JSON.stringify([
      { id: 1, name: "Alpha Traders" },
    ]));
    const user = userEvent.setup();
    render(React.createElement(LedgerHarness));
    const input = screen.getByRole("combobox");

    await user.type(input, "Completely New Ledger");
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.queryByText("No matching saved ledgers")).toBeNull();
    expect(input.value).toBe("Completely New Ledger");
  });

  it("saves an edited name after a saved ledger was selected", async () => {
    localStorage.setItem("billmaster.preview.ledgers", JSON.stringify([
      { id: 1, name: "Alpha Traders" },
    ]));
    const user = userEvent.setup();

    function RenameHarness() {
      const [value, setValue] = React.useState("");
      return React.createElement(LedgerAutocomplete, {
        value,
        onChange: setValue,
        inputRef: { current: null },
      });
    }

    render(React.createElement(RenameHarness));
    const input = screen.getByRole("combobox");
    await user.type(input, "Alpha");
    await screen.findByRole("option", { name: "Alpha Traders" });
    await user.keyboard("{ArrowDown}{Enter}");
    expect(input.value).toBe("Alpha Traders");

    await user.click(input);
    await user.keyboard("{Control>}a{/Control}Alpha Supplies{Enter}");
    await waitFor(() => {
      const ledgers = JSON.parse(localStorage.getItem("billmaster.preview.ledgers"));
      expect(ledgers[0].name).toBe("Alpha Supplies");
    });
  });

  it("opens ledger alteration with Ctrl+Enter and stops at the last search result", async () => {
    localStorage.setItem("billmaster.preview.ledgers", JSON.stringify([
      { id: 1, name: "Alpha Traders" },
      { id: 2, name: "Alpine Stores" },
    ]));
    const user = userEvent.setup();
    render(React.createElement(LedgerHarness));
    const input = screen.getByRole("combobox");

    await user.type(input, "Al");
    await screen.findByRole("option", { name: "Alpha Traders" });
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(screen.getByRole("option", { name: "Alpine Stores" }).getAttribute("aria-selected")).toBe("true");
    await user.keyboard("{Enter}");
    await user.keyboard("{Control>}{Enter}{/Control}");

    expect(screen.getByRole("heading", { name: "Alter ledger" })).toBeTruthy();
    const editInput = screen.getByLabelText("Ledger name", { selector: "#newLedgerName" });
    await user.clear(editInput);
    await user.type(editInput, "Alpine Supplies{Enter}");
    await waitFor(() => {
      const ledgers = JSON.parse(localStorage.getItem("billmaster.preview.ledgers"));
      expect(ledgers.find((ledger) => ledger.id === 2).name).toBe("Alpine Supplies");
    });
    expect(input.value).toBe("Alpine Supplies");
  });
});
