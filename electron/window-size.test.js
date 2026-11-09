import { describe, expect, it } from "vitest";
import { getStartBounds } from "./window-size.js";

describe("start window size", () => {
  it("opens at 1440x920 in the middle of a big screen", () => {
    expect(getStartBounds({ x: 0, y: 0, width: 1920, height: 1040 })).toEqual({
      width: 1440, height: 920, x: 240, y: 60, minWidth: 1080, minHeight: 720,
    });
  });

  it("fits a small laptop screen instead of spilling over it", () => {
    expect(getStartBounds({ x: 0, y: 0, width: 1366, height: 728 })).toEqual({
      width: 1366, height: 728, x: 0, y: 0, minWidth: 1080, minHeight: 720,
    });
  });

  it("never asks for a minimum bigger than the screen", () => {
    const bounds = getStartBounds({ x: 0, y: 0, width: 1024, height: 700 });
    expect(bounds.minWidth).toBe(1024);
    expect(bounds.minHeight).toBe(700);
  });
});
