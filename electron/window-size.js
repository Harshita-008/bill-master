export const DEFAULT_SIZE = { width: 1440, height: 920 };
export const MIN_SIZE = { width: 1080, height: 720 };

// fit the window inside the screen and put it in the middle
export function getStartBounds(workArea) {
  const width = Math.min(DEFAULT_SIZE.width, workArea.width);
  const height = Math.min(DEFAULT_SIZE.height, workArea.height);
  return {
    width,
    height,
    x: workArea.x + Math.round((workArea.width - width) / 2),
    y: workArea.y + Math.round((workArea.height - height) / 2),
    minWidth: Math.min(MIN_SIZE.width, workArea.width),
    minHeight: Math.min(MIN_SIZE.height, workArea.height),
  };
}
