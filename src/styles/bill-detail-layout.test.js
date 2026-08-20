import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve("src/styles/layout.css"), "utf8");

describe("saved bill viewport layout", () => {
  it("hides outer overflow and keeps scrolling inside the bill preview", () => {
    expect(css).toContain(".app-shell.bill-detail-route {");
    expect(css).toContain("height: 100dvh;");
    expect(css).toContain("overflow: hidden;");
    expect(css).toContain(".bill-detail-main .bill-detail-scroll {");
    expect(css).toContain("flex: 1;");
    expect(css).toContain("overscroll-behavior: contain;");
  });
});
