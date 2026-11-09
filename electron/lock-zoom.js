const ZOOM_KEYS = ["+", "-", "=", "0", "_"];

// keep the app at 100%, so ctrl + / - / wheel never resizes the screen
export function lockZoom(webContents) {
  const reset = () => webContents.setZoomFactor(1);
  webContents.setVisualZoomLevelLimits(1, 1);
  webContents.on("did-finish-load", reset);
  webContents.on("zoom-changed", reset);
  webContents.on("before-input-event", (event, input) => {
    if ((input.control || input.meta) && ZOOM_KEYS.includes(input.key)) event.preventDefault();
  });
}
