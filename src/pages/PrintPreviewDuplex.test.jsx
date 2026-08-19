import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import PrintPreviewPage from "./PrintPreviewPage";
import { api } from "../services/api";

vi.mock("../services/api", () => ({
  api: {
    getPrinters: vi.fn(async () => []),
    print: vi.fn(async () => ({ success: true })),
  },
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("manual front-and-back printing", () => {
  it("prints odd pages, waits for a flip, and then prints even pages", async () => {
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function getHeight() {
      if (this.classList?.contains("simple-document-header")) return 50;
      if (this.tagName === "THEAD") return 30;
      if (this.tagName === "TFOOT") return 30;
      if (this.hasAttribute?.("data-bill-row")) return 80;
      return 0;
    });
    sessionStorage.setItem("billmaster.printDraft", JSON.stringify({
      companyName: "Acme",
      createdAt: "2026-08-06T00:00:00.000Z",
      items: Array.from({ length: 12 }, (_, index) => ({
        key: `item-${index}`,
        itemName: `Item ${index + 1}`,
        quantity: 1,
        per: "pc",
        rate: 10,
        amount: 10,
      })),
      charges: [],
      grandTotal: 120,
    }));
    const user = userEvent.setup();

    render(<MemoryRouter><PrintPreviewPage /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText(/will print per copy/).textContent).toBe("3 pages will print per copy"));
    await user.click(screen.getByRole("button", { name: "Front & back" }));
    expect(screen.getByText("2 physical sheets for 1 copy using both sides")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Start front & back" }));
    await waitFor(() => expect(api.print).toHaveBeenCalledTimes(1));
    expect(api.print).toHaveBeenNthCalledWith(1, expect.objectContaining({
      copies: 1,
      pageRanges: [{ from: 0, to: 0 }, { from: 2, to: 2 }],
    }));
    expect(screen.getByRole("dialog", { name: "Flip and reinsert the printed sheets" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Print back sides" }));
    await waitFor(() => expect(api.print).toHaveBeenCalledTimes(2));
    expect(api.print).toHaveBeenNthCalledWith(2, expect.objectContaining({
      copies: 1,
      pageRanges: [{ from: 1, to: 1 }],
    }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
