import { app, BrowserWindow, ipcMain } from "electron";
import { bringToFront, createMainWindow } from "./main-window.js";
import path from "path";
import process from "node:process";
import { fileURLToPath } from "url";
import {
  DATABASE_FILE_NAME,
  getPersistentUserDataPath,
  migrateLegacyDatabase,
} from "./data-storage.js";
import { printPage } from "./print-job.js";
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
  importItems,
  closeDatabase,
  initializeDatabase,
  saveBill,
  saveChallan,
  updateItem,
  updateItems,
  updateLedger,
} from "./database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = !app.isPackaged;
const originalUserDataPath = app.getPath("userData");
if (!isDev) {
  app.setPath("userData", getPersistentUserDataPath(app.getPath("appData")));
}
let mainWindow = null;
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
  ipcMain.handle("items:import", (_, entries) => importItems(entries));
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
  ipcMain.handle("print", (event, options) => printPage(event.sender, options));
}

function createWindow() {
  mainWindow = createMainWindow({
    icon: path.join(__dirname, "../build/icon.ico"),
    preload: path.join(__dirname, "preload.cjs"),
  });
  mainWindow.on("closed", () => { mainWindow = null; });

  // Warm the Windows print subsystem while the UI loads so the first print is ready sooner.
  loadPrinters(mainWindow.webContents).catch(() => {});

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

// only one BillMaster at a time, a second launch shows the open window
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) bringToFront(mainWindow);
  });
  app.whenReady().then(startApp);
}

function startApp() {
  const databasePath = isDev
    ? path.join(__dirname, "../billmaster.db")
    : path.join(app.getPath("userData"), DATABASE_FILE_NAME);
  if (!isDev) {
    const appDataPath = app.getPath("appData");
    migrateLegacyDatabase(databasePath, [
      path.join(originalUserDataPath, DATABASE_FILE_NAME),
      path.join(appDataPath, "bill-master", DATABASE_FILE_NAME),
      path.join(appDataPath, "billmaster", DATABASE_FILE_NAME),
      path.join(path.dirname(app.getPath("exe")), DATABASE_FILE_NAME),
    ]);
  }
  initializeDatabase(databasePath);
  registerHandlers();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}

app.on("before-quit", closeDatabase);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
