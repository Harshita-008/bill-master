import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import process from "node:process";
import { fileURLToPath } from "url";
import { buildPrintOptions } from "./print-options.js";
import {
  addItems,
  addLedger,
  deleteBill,
  deleteItem,
  deleteItems,
  deleteLedger,
  deleteLedgers,
  deleteChallan,
  getBill,
  getBills,
  getItems,
  getLedgers,
  getChallan,
  getChallans,
  initializeDatabase,
  saveBill,
  saveChallan,
  updateItem,
  updateItems,
  updateLedger,
} from "./database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = !app.isPackaged;
let printerCache = [];
let printerLoadPromise = null;

function loadPrinters(sender, force = false) {
  if (!force && printerCache.length) return Promise.resolve(printerCache);
  if (!force && printerLoadPromise) return printerLoadPromise;
  printerLoadPromise = sender.getPrintersAsync()
    .then((printers) => {
      printerCache = printers;
      return printers;
    })
    .finally(() => { printerLoadPromise = null; });
  return printerLoadPromise;
}

function registerHandlers() {
  ipcMain.handle("bills:save", (_, bill) => saveBill(bill));
  ipcMain.handle("bills:list", () => getBills());
  ipcMain.handle("bills:get", (_, id) => getBill(id));
  ipcMain.handle("bills:delete", (_, id) => deleteBill(id));
  ipcMain.handle("items:list", (_, query, limit) => getItems(query, limit));
  ipcMain.handle("items:add", (_, names) => addItems(names));
  ipcMain.handle("items:delete", (_, id) => deleteItem(id));
  ipcMain.handle("items:delete-many", (_, ids) => deleteItems(ids));
  ipcMain.handle("items:update", (_, id, details) => updateItem(id, details));
  ipcMain.handle("items:update-many", (_, entries) => updateItems(entries));
  ipcMain.handle("ledgers:list", (_, query) => getLedgers(query));
  ipcMain.handle("ledgers:add", (_, name) => addLedger(name));
  ipcMain.handle("ledgers:delete", (_, id) => deleteLedger(id));
  ipcMain.handle("ledgers:delete-many", (_, ids) => deleteLedgers(ids));
  ipcMain.handle("ledgers:update", (_, id, name) => updateLedger(id, name));
  ipcMain.handle("challans:save", (_, challan) => saveChallan(challan));
  ipcMain.handle("challans:list", () => getChallans());
  ipcMain.handle("challans:get", (_, id) => getChallan(id));
  ipcMain.handle("challans:delete", (_, id) => deleteChallan(id));
  ipcMain.handle("printers:list", (event, force) => loadPrinters(event.sender, force));
  ipcMain.handle("print", async (event, options) => {
    const printOnce = (printOptions) => new Promise((resolve) => {
      event.sender.print(printOptions, (success, failureReason) => {
        resolve({ success, failureReason });
      });
    });
    const printOptions = buildPrintOptions(options);
    const directResult = await printOnce(printOptions);
    if (directResult.success || directResult.failureReason !== "Invalid printer settings" || !options.deviceName) {
      return directResult;
    }

    const fallbackResult = await printOnce({
      ...printOptions,
      silent: false,
      deviceName: undefined,
    });
    return {
      ...fallbackResult,
      usedSystemDialog: true,
      directFailureReason: directResult.failureReason,
    };
  });
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 720,
    backgroundColor: "#0d0b12",
    autoHideMenuBar: true,
    icon: path.join(__dirname, "../build/icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Warm the Windows print subsystem while the UI loads so the first print is ready sooner.
  loadPrinters(window.webContents).catch(() => {});

  if (isDev) {
    window.loadURL("http://localhost:5173");
  } else {
    window.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  const databasePath = isDev
    ? path.join(__dirname, "../billmaster.db")
    : path.join(app.getPath("userData"), "billmaster.db");
  initializeDatabase(databasePath);
  registerHandlers();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
