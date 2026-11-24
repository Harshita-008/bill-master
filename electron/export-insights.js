import fs from "node:fs";
import { dialog } from "electron";

// save the insights page as a pdf wherever the user picks
export async function exportInsights(webContents) {
  const today = new Date().toISOString().slice(0, 10);
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "Save insights report",
    defaultPath: `BillMaster insights ${today}.pdf`,
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });
  if (canceled || !filePath) return { saved: false };

  const pdf = await webContents.printToPDF({
    landscape: true,
    pageSize: "A4",
    printBackground: true,
    // shrink so the whole dashboard fits on one page
    scale: 0.62,
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  });
  fs.writeFileSync(filePath, pdf);
  return { saved: true, filePath };
}
