import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import InsightsPage from "./InsightsPage";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function saveActivity(kind, rows) {
  localStorage.setItem(`billmaster.preview.activity.${kind}`, JSON.stringify(rows));
}

const today = new Date();
const row = (seconds, items, printed, saved) => ({ madeAt: today.toISOString(), items, total: 2000, seconds, printed, saved });

describe("insights page", () => {
  it("shows the counts, average time and printed vs saved from the log", async () => {
    saveActivity("bill", [row(60, 3, true, false), row(120, 8, true, true), row(90, 2, false, true)]);
    saveActivity("challan", [row(null, 0, true, false)]);
    render(<MemoryRouter><InsightsPage /></MemoryRouter>);

    expect(await screen.findByText("How BillMaster is used")).toBeTruthy();
    const tiles = document.querySelectorAll(".stat-tile strong");
    expect([...tiles].map((tile) => tile.textContent)).toEqual(["3", "1", "1 min 30 s", "1", "₹6,000"]);
    expect(screen.getByText("Printed only, 1")).toBeTruthy();
    expect(screen.getByText("Printed and saved, 1")).toBeTruthy();
    expect(screen.getByText("Saved only, 1")).toBeTruthy();
  });

  it("switches between day, week, month and year", async () => {
    saveActivity("bill", [row(60, 3, true, false)]);
    const user = userEvent.setup();
    render(<MemoryRouter><InsightsPage /></MemoryRouter>);
    await screen.findByText("How BillMaster is used");

    await user.click(screen.getByRole("button", { name: "Year" }));
    expect(screen.getByRole("button", { name: "Year" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText(`Bills made per month, ${today.getFullYear()}`)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Day" }));
    expect(screen.getByText("Bills made per hour, today")).toBeTruthy();
  });

  it("works with no bills yet", async () => {
    render(<MemoryRouter><InsightsPage /></MemoryRouter>);
    expect(await screen.findByText("No bills yet")).toBeTruthy();
    expect(screen.getAllByText("Not timed yet").length).toBeGreaterThan(0);
  });
});
