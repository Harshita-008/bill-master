import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import ThemeProvider from "../../context/ThemeProvider";
import AppShell from "./AppShell";

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

function renderShell(initialEntries, initialIndex) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<div>Landing page</div>} />
            <Route path="/bills" element={<div>Ledger list</div>} />
            <Route path="/bills/company/:companyName" element={<div>Ledger bills</div>} />
            <Route path="/bills/:id" element={<div>Selected bill</div>} />
            <Route path="/bills/new" element={<div>Bill editor</div>} />
            <Route path="/print" element={<div>Print preview</div>} />
            <Route path="/challans" element={<div>Saved challans</div>} />
            <Route path="/challans/new" element={<div>New challan</div>} />
            <Route path="/challans/:id" element={<div>Selected challan</div>} />
            <Route path="/challans/:id/edit" element={<div>Edit saved challan</div>} />
            <Route path="/challan-print" element={<div>Challan print preview</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe("AppShell Escape navigation", () => {
  it("shows the BillMaster app icon in the header", () => {
    renderShell(["/"], 0);
    const brandIcon = screen.getByRole("button", { name: "BillMaster home" }).querySelector("img");

    expect(brandIcon?.getAttribute("src")).toBe("./billmaster-icon.png");
  });

  it("returns from the bill editor to the landing page", async () => {
    sessionStorage.setItem("billmaster.editorDraft", "saved draft");
    sessionStorage.setItem("billmaster.printDraft", "print draft");
    const user = userEvent.setup();
    renderShell(["/bills/new"], 0);

    expect(screen.getByText("Bill editor")).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(screen.getByText("Landing page")).toBeTruthy();
    expect(sessionStorage.getItem("billmaster.editorDraft")).toBeNull();
    expect(sessionStorage.getItem("billmaster.printDraft")).toBeNull();
  });

  it("returns from print preview to its bill editor draft", async () => {
    const user = userEvent.setup();
    renderShell([{
      pathname: "/print",
      state: { returnTo: "/bills/new" },
    }], 0);

    expect(screen.getByText("Print preview")).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(screen.getByText("Bill editor")).toBeTruthy();
  });

  it("returns from one ledger's bills to the ledger list, then home", async () => {
    const user = userEvent.setup();
    renderShell(["/bills/company/ndc"], 0);

    expect(screen.getByText("Ledger bills")).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(screen.getByText("Ledger list")).toBeTruthy();

    await user.keyboard("{Escape}");
    expect(screen.getByText("Landing page")).toBeTruthy();
  });

  it("returns from a selected bill through its ledger bills and ledger list, then home", async () => {
    const user = userEvent.setup();
    renderShell([{
      pathname: "/bills/17",
      state: { returnTo: "/bills/company/ndc" },
    }], 0);

    expect(screen.getByText("Selected bill")).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(screen.getByText("Ledger bills")).toBeTruthy();

    await user.keyboard("{Escape}");
    expect(screen.getByText("Ledger list")).toBeTruthy();

    await user.keyboard("{Escape}");
    expect(screen.getByText("Landing page")).toBeTruthy();
  });

  it("returns from challan print to the selected challan and then to saved challans", async () => {
    const user = userEvent.setup();
    renderShell([{
      pathname: "/challan-print",
      state: { returnTo: "/challans/1" },
    }], 0);

    expect(screen.getByText("Challan print preview")).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(screen.getByText("Selected challan")).toBeTruthy();

    await user.keyboard("{Escape}");
    expect(screen.getByText("Saved challans")).toBeTruthy();

    await user.keyboard("{Escape}");
    expect(screen.getByText("Landing page")).toBeTruthy();
  });

  it("returns directly from saved challans to the landing page", async () => {
    const user = userEvent.setup();
    renderShell(["/challans"], 0);

    expect(screen.getByText("Saved challans")).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(screen.getByText("Landing page")).toBeTruthy();
  });

  it("returns from a saved challan edit to that selected challan", async () => {
    const user = userEvent.setup();
    renderShell(["/challans/7/edit"], 0);

    expect(screen.getByText("Edit saved challan")).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(screen.getByText("Selected challan")).toBeTruthy();
  });

  it("returns from a new challan to the landing page", async () => {
    const user = userEvent.setup();
    renderShell(["/challans/new"], 0);

    expect(screen.getByText("New challan")).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(screen.getByText("Landing page")).toBeTruthy();
  });

  it("returns from a newly created challan preview to its filled create page, then home", async () => {
    sessionStorage.setItem("billmaster.challanEditorDraft", "filled challan draft");
    sessionStorage.setItem("billmaster.challanPrintDraft", "print challan draft");
    const user = userEvent.setup();
    renderShell([{
      pathname: "/challan-print",
      state: { returnTo: "/challans/new" },
    }], 0);

    await user.keyboard("{Escape}");
    expect(screen.getByText("New challan")).toBeTruthy();
    expect(sessionStorage.getItem("billmaster.challanEditorDraft")).toBe("filled challan draft");

    await user.keyboard("{Escape}");
    expect(screen.getByText("Landing page")).toBeTruthy();
    expect(sessionStorage.getItem("billmaster.challanEditorDraft")).toBeNull();
    expect(sessionStorage.getItem("billmaster.challanPrintDraft")).toBeNull();
  });
});
