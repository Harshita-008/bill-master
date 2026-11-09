import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { lockZoom } from "./lock-zoom.js";

function fakeWebContents() {
  const contents = new EventEmitter();
  contents.setZoomFactor = vi.fn();
  contents.setVisualZoomLevelLimits = vi.fn();
  return contents;
}

describe("zoom lock", () => {
  it("puts the zoom back to 100% after load and after any zoom change", () => {
    const contents = fakeWebContents();
    lockZoom(contents);
    expect(contents.setVisualZoomLevelLimits).toHaveBeenCalledWith(1, 1);

    contents.emit("did-finish-load");
    contents.emit("zoom-changed", {}, "in");
    expect(contents.setZoomFactor).toHaveBeenCalledTimes(2);
    expect(contents.setZoomFactor).toHaveBeenLastCalledWith(1);
  });

  it("blocks ctrl + / - / 0 but lets normal typing through", () => {
    const contents = fakeWebContents();
    lockZoom(contents);
    const press = (input) => {
      const event = { preventDefault: vi.fn() };
      contents.emit("before-input-event", event, input);
      return event.preventDefault.mock.calls.length > 0;
    };

    expect(press({ key: "-", control: true })).toBe(true);
    expect(press({ key: "=", control: true })).toBe(true);
    expect(press({ key: "0", control: true })).toBe(true);
    expect(press({ key: "-", control: false })).toBe(false);
    expect(press({ key: "c", control: true })).toBe(false);
  });
});
