import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve("src/styles/print.css"), "utf8");
const challanCss = readFileSync(resolve("src/styles/challan.css"), "utf8");

describe("physical print layout", () => {
  it("preserves the fixed A6 width and centers it on the printer's top-anchored media", () => {
    const printCss = css.slice(css.indexOf("@media print"));

    expect(css).toContain(".bill-document.page-a6 { width: 105mm; min-height: 148mm;");
    expect(css).toContain(".bill-document.page-a4 { width: 210mm; min-height: 297mm;");
    expect(css).toContain(".bill-preview-stack .bill-document.page-a6,");
    expect(css).toContain(".bill-document.challan-document.page-a6 { height: 148mm; min-height: 0; }");
    expect(css).toContain(".bill-document.challan-document.page-a4 { height: 297mm; min-height: 0; }");
    expect(css).toContain("box-sizing: border-box;");
    expect(printCss).toContain("width: auto !important;");
    expect(printCss).toContain(".preview-paper-frame > .bill-document,");
    expect(printCss).toContain("position: static !important;");
    expect(printCss).toContain(".bill-document.page-a6 {");
    expect(printCss).toContain("margin-left: auto !important;");
    expect(printCss).toContain("margin-right: auto !important;");
  });

  it("lets recipient lines use the page width while keeping the date at the top-right", () => {
    expect(challanCss).toContain(".challan-document-header { position: relative;");
    expect(challanCss).toContain(".challan-document-recipient {");
    expect(challanCss).toContain("margin-top: 7mm;");
    expect(challanCss).toContain("margin-left: 17mm;");
    expect(challanCss).toContain("grid-template-columns: auto minmax(0, 1fr);");
    expect(challanCss).toContain("column-gap: 6mm;");
    expect(challanCss).toContain(".challan-document-to { min-width: 0; padding-right: 2mm; }");
    expect(challanCss).toContain("min-height: 1.4em;");
    expect(challanCss).toContain("line-height: 1.25;");
    expect(challanCss).toContain("font-size: var(--challan-line-size, 1em);");
    expect(challanCss).toContain("position: absolute;");
    expect(challanCss).toContain("right: 0;");
    expect(challanCss).toContain("top: 45%;");
    expect(challanCss).toContain("left: 15mm;");
    expect(challanCss).toContain("bottom: 8mm;");
    expect(challanCss).toContain("left: 34mm;");
    expect(challanCss).toContain("overflow-wrap: anywhere;");
  });

  it("uses compact A6 bill rows without changing the A4 row spacing", () => {
    expect(css).toContain(".page-a6 .simple-document-table th,");
    expect(css).toContain("padding-top: .45mm;");
    expect(css).toContain("padding-bottom: .45mm;");
    expect(css).toContain("line-height: 1.12;");
  });

  it("uses tighter bill columns so more item names remain on one line", () => {
    expect(css).toContain("padding: 1.5mm .5mm;");
    expect(css).toContain(".simple-document-table .qty-column { width: 8%; }");
    expect(css).toContain(".simple-document-table .per-column { width: 10%; }");
    expect(css).toContain(".simple-document-table .items-column { width: 48%; }");
    expect(css).toContain(".simple-document-table .rate-column { width: 15%; }");
    expect(css).toContain(".simple-document-table .amount-column { width: 19%; }");
  });

  it("paginates long bills without splitting rows and repeats headings", () => {
    const printCss = css.slice(css.indexOf("@media print"));
    expect(css).toContain("overflow: auto;");
    expect(css).toContain(".bill-preview-stack {");
    expect(css).toContain("flex-direction: column; gap: 24px;");
    expect(printCss).toContain(".simple-document-table thead { display: table-header-group; }");
    expect(printCss).toContain("page-break-after: always !important;");
    expect(printCss).toContain("break-inside: avoid;");
    expect(printCss).toContain("page-break-inside: avoid;");
  });
});
