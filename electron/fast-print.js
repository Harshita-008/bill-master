import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import pdfToPrinter from "pdf-to-printer";

const require = createRequire(import.meta.url);

// sumatra has to run from outside app.asar in the installed app
function sumatraPath() {
  const folder = path.dirname(require.resolve("pdf-to-printer/package.json"));
  const exe = path.join(folder, "dist", "SumatraPDF-3.4.6-32.exe");
  return exe.replace(`app.asar${path.sep}`, `app.asar.unpacked${path.sep}`);
}

// [{ from: 0, to: 0 }, { from: 2, to: 2 }] -> "1,3"
export function toPageList(ranges = []) {
  return ranges
    .map((range) => (range.from === range.to ? `${range.from + 1}` : `${range.from + 1}-${range.to + 1}`))
    .join(",");
}

// make a pdf of the page and send it straight to the windows printer,
// this skips chromium's slow printer setup (canon drivers take 10+ sec there)
export async function printFast(webContents, options) {
  const isA4 = options.pageSize === "A4";
  const pdfOptions = {
    pageSize: isA4 ? "A4" : "A6",
    printBackground: true,
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  };
  const pages = toPageList(options.pageRanges);
  if (pages) pdfOptions.pageRanges = pages;

  const pdf = await webContents.printToPDF(pdfOptions);
  const file = path.join(os.tmpdir(), `billmaster-print-${Date.now()}.pdf`);
  fs.writeFileSync(file, pdf);
  try {
    await pdfToPrinter.print(file, {
      printer: options.deviceName,
      copies: Math.max(1, Number(options.copies) || 1),
      scale: "noscale",
      // tell the printer the real paper, else it puts a6 in the corner of its default a4
      paperSize: isA4 ? "A4" : "A6",
      sumatraPdfPath: sumatraPath(),
    });
  } finally {
    fs.rm(file, { force: true }, () => {});
  }
}
