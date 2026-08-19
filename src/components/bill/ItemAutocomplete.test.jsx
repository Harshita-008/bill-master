import React from "react";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ItemAutocomplete from "./ItemAutocomplete";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("ItemAutocomplete", () => {
  it("does not show saved items until the user types", async () => {
    localStorage.setItem("billmaster.preview.items", JSON.stringify([
      { id: 1, name: "Cement" },
    ]));
    const user = userEvent.setup();
    render(React.createElement(ItemAutocomplete, {
      value: "",
      onChange: vi.fn(),
      ariaLabel: "Item name",
    }));

    await user.click(screen.getByRole("combobox"));
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("matches saved item names even when the typed search omits spaces", async () => {
    localStorage.setItem("billmaster.preview.items", JSON.stringify([
      { id: 1, name: "Drum 101" },
      { id: 2, name: "Drum 202" },
      { id: 3, name: "12A DRUM OEM" },
      { id: 4, name: "071 DRUM" },
      { id: 5, name: "47A ROLLER BLACK SPRING NEW" },
    ]));
    const user = userEvent.setup();

    function Harness() {
      const [value, setValue] = React.useState("");
      return React.createElement(ItemAutocomplete, {
        value,
        onChange: setValue,
        ariaLabel: "Item name",
      });
    }

    render(React.createElement(Harness));
    await user.type(screen.getByRole("combobox"), "drum101");

    expect(await screen.findByRole("option", { name: "Drum 101" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: "Drum 202" })).toBeNull();

    await user.clear(screen.getByRole("combobox"));
    await user.type(screen.getByRole("combobox"), "drumoem");
    expect(await screen.findByRole("option", { name: "12A DRUM OEM" })).toBeTruthy();

    await user.clear(screen.getByRole("combobox"));
    await user.type(screen.getByRole("combobox"), "071drum");
    expect(await screen.findByRole("option", { name: "071 DRUM" })).toBeTruthy();

    await user.clear(screen.getByRole("combobox"));
    await user.type(screen.getByRole("combobox"), "rollerspring");
    expect(await screen.findByRole("option", { name: "47A ROLLER BLACK SPRING NEW" })).toBeTruthy();
  });

  it("searches, scrolls with keyboard selection, and saves an edited selected name", async () => {
    localStorage.setItem("billmaster.preview.items", JSON.stringify([
      { id: 1, name: "Cement" },
      { id: 2, name: "Ceramic Tile" },
      { id: 3, name: "Bricks" },
    ]));
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    function Harness() {
      const [value, setValue] = React.useState("CE");
      return React.createElement(ItemAutocomplete, {
        value,
        onChange: setValue,
        ariaLabel: "Item name",
        onEnter: vi.fn(),
      });
    }

    render(React.createElement(Harness));

    const input = screen.getByRole("combobox");
    await user.click(input);
    expect(await screen.findByRole("option", { name: "Cement" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Ceramic Tile" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: "Bricks" })).toBeNull();

    await user.keyboard("{ArrowDown}{Enter}");
    expect(input.value).toBe("Cement");
    expect(scrollIntoView).toHaveBeenCalled();

    await user.click(input);
    await user.keyboard("{Control>}a{/Control}Cement Plus{Enter}");
    await waitFor(() => {
      const items = JSON.parse(localStorage.getItem("billmaster.preview.items"));
      expect(items.find((item) => item.id === 1).name).toBe("Cement Plus");
    });
  });

  it("opens item alteration with Ctrl+Enter and saves the edited name", async () => {
    localStorage.setItem("billmaster.preview.items", JSON.stringify([
      { id: 1, name: "Original Drum", rate: 100, per: "pc" },
    ]));
    const user = userEvent.setup();

    function AlterHarness() {
      const [value, setValue] = React.useState("");
      return React.createElement(ItemAutocomplete, {
        value,
        onChange: setValue,
        ariaLabel: "Item name",
      });
    }

    render(React.createElement(AlterHarness));
    const itemInput = screen.getByRole("combobox");
    await user.type(itemInput, "Original");
    await screen.findByRole("option", { name: "Original Drum" });
    await user.keyboard("{ArrowDown}{Enter}");
    expect(itemInput.value).toBe("Original Drum");

    await user.click(itemInput);
    await user.keyboard("{Control>}{Enter}{/Control}");
    expect(screen.getByRole("heading", { name: "Alter item" })).toBeTruthy();

    const editInput = screen.getByLabelText("Item name", { selector: "#newItemName" });
    await user.clear(editInput);
    await user.type(editInput, "Altered Drum{Enter}");
    const rateInput = screen.getByLabelText("Rate");
    expect(rateInput.value).toBe("100");
    await user.clear(rateInput);
    await user.type(rateInput, "125{Enter}");
    const perInput = screen.getByLabelText("Per");
    expect(perInput.value).toBe("pc");
    await user.clear(perInput);
    await user.type(perInput, "pkt{Enter}");

    await waitFor(() => {
      const items = JSON.parse(localStorage.getItem("billmaster.preview.items"));
      expect(items[0].name).toBe("Altered Drum");
      expect(items[0].rate).toBe(125);
      expect(items[0].per).toBe("pkt");
    });
    expect(itemInput.value).toBe("Altered Drum");
    expect(document.activeElement).toBe(itemInput);
  });

  it("renders live search results in the dedicated right-side host", async () => {
    localStorage.setItem("billmaster.preview.items", JSON.stringify([
      { id: 1, name: "05A Drum" },
      { id: 2, name: "1215 Drum" },
      { id: 3, name: "Drum Bush" },
    ]));
    const host = document.createElement("aside");
    host.className = "suggestion-rail";
    document.body.appendChild(host);
    const user = userEvent.setup();

    function RailHarness() {
      const [value, setValue] = React.useState("");
      return React.createElement(ItemAutocomplete, {
        value,
        onChange: setValue,
        ariaLabel: "Item name",
        suggestionHost: host,
      });
    }

    render(React.createElement(RailHarness));
    const input = screen.getByRole("combobox");
    await user.type(input, "drum");
    const rail = within(host);
    expect(await rail.findByText("Item search")).toBeTruthy();
    expect(rail.getByText("drum")).toBeTruthy();
    expect(await rail.findByText("3 matches")).toBeTruthy();

    await user.keyboard("{ArrowDown}");
    expect(rail.getByRole("option", { name: /05A Drum/ }).getAttribute("aria-selected")).toBe("true");
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(rail.getByRole("option", { name: /Drum Bush/ }).getAttribute("aria-selected")).toBe("true");
    host.remove();
  });
});
