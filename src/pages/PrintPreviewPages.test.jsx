import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import PrintPreviewPage from "./PrintPreviewPage";
import ChallanPrintPreviewPage from "./ChallanPrintPreviewPage";

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("print preview keyboard defaults", () => {
  it("prints a bill when Enter is the first action", async () => {
    sessionStorage.setItem("billmaster.printDraft", JSON.stringify({
      companyName: "Acme",
      createdAt: "2026-08-06T00:00:00.000Z",
      items: [],
      charges: [],
      grandTotal: 0,
    }));
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<MemoryRouter><PrintPreviewPage /></MemoryRouter>);

    const copiesInput = screen.getByLabelText("Number of copies");
    await user.click(copiesInput);
    await user.keyboard("{ArrowRight}{Backspace}");
    expect(copiesInput.value).toBe("");
    await user.keyboard("1");
    copiesInput.blur();
    await user.keyboard("{Backspace}");
    expect(document.activeElement).toBe(copiesInput);
    await user.keyboard("5");
    expect(copiesInput.value).toBe("5");

    copiesInput.blur();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(print).toHaveBeenCalledTimes(1));
  });

  it("makes a long bill preview scrollable and reports all required pages", async () => {
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

    render(<MemoryRouter><PrintPreviewPage /></MemoryRouter>);

    const preview = screen.getByRole("region", { name: "Scrollable bill preview" });
    expect(preview.getAttribute("tabindex")).toBe("0");
    await waitFor(() => {
      expect(screen.getByText(/will print per copy/).textContent).toBe("3 pages will print per copy");
    });
    expect(screen.getAllByRole("article", { name: /Bill page/ })).toHaveLength(3);

    const copiesInput = screen.getByLabelText("Number of copies");
    await userEvent.click(copiesInput);
    await userEvent.keyboard("2");
    expect(await screen.findByText("6 physical sheets for 2 copies")).toBeTruthy();
  });

  it("starts challan printing at two copies and prints on the first Enter", async () => {
    sessionStorage.setItem("billmaster.challanPrintDraft", JSON.stringify({
      toLine1: "Acme",
      toLine2: "",
      toLine3: "",
      challanDate: "06/08/2026",
      boxCount: "2",
      deliveredBy: "Ravi",
    }));
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<MemoryRouter><ChallanPrintPreviewPage /></MemoryRouter>);

    expect(screen.getByLabelText("Number of copies").value).toBe("2");
    await user.keyboard("{Backspace}");
    expect(document.activeElement).toBe(screen.getByLabelText("Number of copies"));
    screen.getByLabelText("Number of copies").blur();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(print).toHaveBeenCalledTimes(1));
  });
});
