import { describe, expect, it } from "vitest";
import { PAPER_MM, pdfPageFor } from "./printer-paper.js";

describe("printer paper", () => {
  it("draws an a6 bill on the printer's own a4 paper", () => {
    expect(pdfPageFor("A6", PAPER_MM.A4)).toEqual({ width: 210 / 25.4, height: 297 / 25.4 });
  });

  it("uses a5 or letter paper when that is the printer's paper", () => {
    expect(pdfPageFor("A6", PAPER_MM.A5)).toEqual({ width: 148 / 25.4, height: 210 / 25.4 });
    expect(pdfPageFor("A6", PAPER_MM.Letter).width).toBeCloseTo(8.5);
  });

  it("keeps a plain a6 page when the printer already uses a6 paper", () => {
    expect(pdfPageFor("A6", PAPER_MM.A6)).toBe("A6");
  });

  it("falls back to a4 paper when windows does not tell the paper", () => {
    expect(pdfPageFor("A6", null)).toEqual({ width: 210 / 25.4, height: 297 / 25.4 });
  });

  it("always prints a4 bills on a4", () => {
    expect(pdfPageFor("A4", PAPER_MM.A5)).toBe("A4");
  });
});
