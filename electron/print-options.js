export function buildPrintOptions(options) {
  const isA4 = options.pageSize === "A4";
  const printOptions = {
    silent: Boolean(options.deviceName),
    printBackground: true,
    deviceName: options.deviceName || undefined,
    copies: Math.max(1, Number(options.copies) || 1),
    collate: true,
    landscape: false,
    margins: { marginType: "none" },
  };

  if (isA4 || !options.deviceName) {
    printOptions.pageSize = isA4 ? "A4" : "A6";
  } else {
    printOptions.usePrinterDefaultPageSize = true;
  }

  const pageRanges = Array.isArray(options.pageRanges)
    ? options.pageRanges.filter((range) => (
      Number.isInteger(range?.from)
      && Number.isInteger(range?.to)
      && range.from >= 0
      && range.to >= range.from
    ))
    : [];
  if (pageRanges.length) printOptions.pageRanges = pageRanges;

  return printOptions;
}
