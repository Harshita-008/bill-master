export function buildPrintOptions(options) {
  const isA4 = options.pageSize === "A4";
  const printOptions = {
    silent: Boolean(options.deviceName),
    printBackground: true,
    deviceName: options.deviceName || undefined,
    copies: Math.max(1, Number(options.copies) || 1),
    landscape: false,
    margins: { marginType: "none" },
  };

  if (isA4 || !options.deviceName) {
    printOptions.pageSize = isA4 ? "A4" : "A6";
  } else {
    printOptions.usePrinterDefaultPageSize = true;
  }

  return printOptions;
}
