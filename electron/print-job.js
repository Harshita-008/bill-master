import process from "node:process";
import { printFast } from "./fast-print.js";
import { buildPrintOptions } from "./print-options.js";

function printWithChromium(webContents, printOptions) {
  return new Promise((resolve) => {
    webContents.print(printOptions, (success, failureReason) => resolve({ success, failureReason }));
  });
}

// old way: electron's own print, with the windows print window if the printer is not accepted
async function printNormally(webContents, options) {
  const printOptions = buildPrintOptions(options);
  const direct = await printWithChromium(webContents, printOptions);
  if (direct.success || direct.failureReason !== "Invalid printer settings" || !options.deviceName) {
    return direct;
  }
  const fallback = await printWithChromium(webContents, { ...printOptions, silent: false, deviceName: undefined });
  return { ...fallback, usedSystemDialog: true, directFailureReason: direct.failureReason };
}

export async function printPage(webContents, options) {
  const started = Date.now();
  const seconds = () => Number(((Date.now() - started) / 1000).toFixed(1));

  // fast way first when a printer is chosen, the old way is the backup
  if (options.deviceName && process.platform === "win32") {
    try {
      await printFast(webContents, options);
      return { success: true, fast: true, seconds: seconds() };
    } catch (error) {
      console.warn("Fast print failed, using normal print:", error.message);
    }
  }
  const result = await printNormally(webContents, options);
  return { ...result, seconds: seconds() };
}
