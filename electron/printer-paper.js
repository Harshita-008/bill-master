import { execFile } from "node:child_process";
import process from "node:process";

// paper sizes in mm, names as windows gives them
export const PAPER_MM = {
  A3: { width: 297, height: 420 },
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  A6: { width: 105, height: 148 },
  B5: { width: 182, height: 257 },
  Letter: { width: 215.9, height: 279.4 },
  Legal: { width: 215.9, height: 355.6 },
  Executive: { width: 184.2, height: 266.7 },
  Statement: { width: 139.7, height: 215.9 },
  Folio: { width: 215.9, height: 330.2 },
};

const SCRIPT = "Get-Printer | ForEach-Object { $c = Get-PrintConfiguration -PrinterName $_.Name -ErrorAction SilentlyContinue; "
  + "[pscustomobject]@{ name = $_.Name; paper = \"$($c.PaperSize)\" } } | ConvertTo-Json -Compress";

let paperByPrinter = null;

// ask windows once for every printer's default paper (takes ~2 sec, so it runs in the background)
export function loadPrinterPapers() {
  if (paperByPrinter) return paperByPrinter;
  paperByPrinter = new Promise((resolve) => {
    if (process.platform !== "win32") return resolve(new Map());
    execFile("powershell.exe", ["-NoProfile", "-Command", SCRIPT], { windowsHide: true }, (error, stdout) => {
      if (error || !stdout.trim()) return resolve(new Map());
      try {
        const list = [].concat(JSON.parse(stdout));
        resolve(new Map(list.map((printer) => [printer.name, printer.paper])));
      } catch {
        resolve(new Map());
      }
    });
  });
  return paperByPrinter;
}

const MM_PER_INCH = 25.4;

// a6 is drawn on the printer's own paper, centred at the top (like the preview on real paper)
export function pdfPageFor(pageSize, printerPaper) {
  if (pageSize === "A4") return "A4";
  const paper = printerPaper || PAPER_MM.A4;
  if (paper.width <= PAPER_MM.A6.width + 1) return "A6";
  return { width: paper.width / MM_PER_INCH, height: paper.height / MM_PER_INCH };
}

// read the papers again, e.g. after the user refreshes printers
export function reloadPrinterPapers() {
  paperByPrinter = null;
  return loadPrinterPapers();
}

// paper size in mm for a printer, or null when windows does not tell us
export async function getPrinterPaper(printerName) {
  const papers = await loadPrinterPapers();
  return PAPER_MM[papers.get(printerName)] || null;
}
