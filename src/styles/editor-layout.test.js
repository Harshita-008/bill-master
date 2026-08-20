import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve("src/styles/forms.css"), "utf8");

describe("bill editor layout", () => {
  it("gives item names more room by narrowing quantity and per columns", () => {
    expect(css).toContain("grid-template-columns: minmax(295px, 1fr) 75px 115px 70px 145px 104px;");
  });

  it("keeps the right-side search results visible while the bill scrolls", () => {
    expect(css).toContain(".editor-columns {");
    expect(css).toContain("grid-template-columns: minmax(0, 1fr) 360px;");
    expect(css).toContain(".suggestion-rail {");
    expect(css).toContain("position: sticky;");
    expect(css).toContain("top: 88px;");
    expect(css).toContain("height: calc(100vh - 104px);");
  });

  it("keeps the create bill heading compact so the form starts higher", () => {
    expect(css).toContain("padding-top: 26px;");
    expect(css).toContain(".editor-workspace > .page-header h1 { font-size: clamp(30px, 3vw, 40px); margin-bottom: 0; }");
    expect(css).toContain(".editor-workspace > .page-header .eyebrow { margin-bottom: 7px; }");
  });

  it("keeps comfortable space below a newly focused item row", () => {
    expect(css).toContain(".bill-row input { scroll-margin-block-end: min(24vh, 220px); }");
  });
});
