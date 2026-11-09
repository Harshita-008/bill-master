import { BrowserWindow, screen } from "electron";
import { lockZoom } from "./lock-zoom.js";
import { getStartBounds } from "./window-size.js";

// open in normal size: never minimized or maximized on start
function showNormal(window, bounds) {
  window.show();
  if (window.isMinimized()) window.restore();
  if (window.isMaximized()) window.unmaximize();
  window.setBounds({ x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height });
  window.focus();
}

export function createMainWindow({ icon, preload }) {
  const bounds = getStartBounds(screen.getPrimaryDisplay().workArea);
  const window = new BrowserWindow({
    ...bounds,
    show: false,
    backgroundColor: "#0d0b12",
    icon,
    webPreferences: { preload, contextIsolation: true, nodeIntegration: false },
  });

  // no menu bar, so alt + tab can not pop it up and push the app down
  window.removeMenu();
  lockZoom(window.webContents);

  let shown = false;
  const showOnce = () => {
    if (shown) return;
    shown = true;
    showNormal(window, bounds);
  };
  window.once("ready-to-show", showOnce);
  // still show the window if the page is slow to load
  setTimeout(showOnce, 4000);

  return window;
}

// opening the app again brings the same window back
export function bringToFront(window) {
  if (window.isMinimized()) window.restore();
  window.show();
  window.focus();
}
