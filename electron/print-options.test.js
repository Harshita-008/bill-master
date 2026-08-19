import { describe, expect, it } from "vitest";
import { buildPrintOptions } from "./print-options";

describe("buildPrintOptions", () => {
  it("uses the selected printer's configured A6 media so printing starts at the physical top", () => {
    const options = buildPrintOptions({ pageSize: "A6", copies: 2, deviceName: "Office_Printer" });
    expect(options).toEqual(expect.objectContaining({
      silent: true,
      deviceName: "Office_Printer",
      copies: 2,
      usePrinterDefaultPageSize: true,
      margins: { marginType: "none" },
      printBackground: true,
    }));
    expect(options.pageSize).toBeUndefined();
    expect(options.scaleFactor).toBeUndefined();
  });

  it("keeps the existing explicit A4 print path unchanged", () => {
    const options = buildPrintOptions({ pageSize: "A4", copies: 1, deviceName: "Office_Printer" });
    expect(options.pageSize).toBe("A4");
    expect(options.usePrinterDefaultPageSize).toBeUndefined();
    expect(options.margins).toEqual({ marginType: "none" });
  });

  it("also uses named A6 when the Windows print dialog must choose the printer", () => {
    const options = buildPrintOptions({ pageSize: "A6", copies: 1, deviceName: "" });
    expect(options.pageSize).toBe("A6");
    expect(options.silent).toBe(false);
  });
});
