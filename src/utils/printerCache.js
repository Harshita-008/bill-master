export const PREFERRED_PRINTER_KEY = "billmaster.preferredPrinter";
const PRINTER_CACHE_KEY = "billmaster.printerCache";

function isPrinter(printer) {
  return printer && typeof printer.name === "string" && printer.name.length > 0;
}

export function readCachedPrinters() {
  try {
    const cached = JSON.parse(localStorage.getItem(PRINTER_CACHE_KEY));
    if (Array.isArray(cached) && cached.every(isPrinter)) return cached;
  } catch {
    // A damaged cache should never prevent printing.
  }

  const preferredName = localStorage.getItem(PREFERRED_PRINTER_KEY);
  return preferredName ? [{ name: preferredName, displayName: preferredName }] : [];
}

export function cachePrinters(printers) {
  const validPrinters = Array.isArray(printers) ? printers.filter(isPrinter) : [];
  localStorage.setItem(PRINTER_CACHE_KEY, JSON.stringify(validPrinters));
  return validPrinters;
}

export function choosePrinter(printers, currentName = "") {
  return printers.find((printer) => printer.name === currentName)
    || printers.find((printer) => printer.isDefault)
    || printers[0]
    || null;
}

export function rememberPrinter(name) {
  if (name) localStorage.setItem(PREFERRED_PRINTER_KEY, name);
  else localStorage.removeItem(PREFERRED_PRINTER_KEY);
}
