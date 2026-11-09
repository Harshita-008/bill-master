import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const forms = readFileSync(resolve("src/styles/forms.css"), "utf8");
const voucher = readFileSync(resolve("src/styles/voucher.css"), "utf8");

describe("bill editor layout", () => {
  it("uses tally style columns: item, quantity, rate, per, amount", () => {
    expect(voucher).toContain("--voucher-columns: minmax(260px, 1fr) 100px 120px 80px 150px 48px;");
    expect(voucher).toContain("grid-template-columns: var(--voucher-columns);");
  });

  it("fills the window and scrolls only the item area", () => {
    expect(voucher).toContain("height: calc(100vh - 72px - 32px);");
    expect(voucher).toContain(".items-section .rows { flex: 1; min-height: 0; overflow-y: auto;");
    expect(voucher).toContain(".charges-section, .previous-amount-section { flex: none; }");
    expect(voucher).toContain("position: absolute;");
    expect(voucher).toContain(".voucher .suggestion-rail:empty { display: none; }");
  });

  it("keeps the challan list panel sticky", () => {
    expect(forms).toContain(".suggestion-rail {");
    expect(forms).toContain("position: sticky;");
    expect(forms).toContain("height: calc(100vh - 104px);");
  });

  it("keeps a little space around a focused item row inside the item list", () => {
    expect(voucher).toContain(".bill-row input { scroll-margin-block: 8px; }");
  });
});
