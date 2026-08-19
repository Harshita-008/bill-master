import { beforeEach, describe, expect, it } from "vitest";
import {
  cachePrinters,
  choosePrinter,
  PREFERRED_PRINTER_KEY,
  readCachedPrinters,
  rememberPrinter,
} from "./printerCache";

describe("printer cache", () => {
  beforeEach(() => localStorage.clear());

  it("shows the remembered printer instantly before Windows discovery completes", () => {
    rememberPrinter("Office_Printer");
    expect(readCachedPrinters()).toEqual([
      { name: "Office_Printer", displayName: "Office_Printer" },
    ]);
  });

  it("persists a discovered printer list and keeps the current selection", () => {
    const printers = cachePrinters([
      { name: "Printer_A", displayName: "Printer A", isDefault: true },
      { name: "Printer_B", displayName: "Printer B" },
    ]);
    localStorage.setItem(PREFERRED_PRINTER_KEY, "Printer_B");

    expect(readCachedPrinters()).toEqual(printers);
    expect(choosePrinter(printers, "Printer_B")?.name).toBe("Printer_B");
  });
});
