import process from "node:process";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toPageList } from "./fast-print.js";

// plain fake for the fast printer, fail = true makes it throw
const fast = vi.hoisted(() => ({ fail: false, calls: [] }));
vi.mock("./fast-print.js", async (importOriginal) => ({
  ...(await importOriginal()),
  printFast: async (contents, options) => {
    fast.calls.push(options);
    if (fast.fail) throw new Error("no sumatra");
  },
}));

const { printPage } = await import("./print-job.js");

function fakeWebContents() {
  const calls = [];
  return { calls, print: (options, done) => { calls.push(options); done(true, ""); } };
}

beforeEach(() => {
  fast.fail = false;
  fast.calls = [];
});

describe("print job", () => {
  it("turns front and back page ranges into a page list", () => {
    expect(toPageList([{ from: 0, to: 0 }, { from: 2, to: 2 }, { from: 4, to: 5 }])).toBe("1,3,5-6");
    expect(toPageList()).toBe("");
  });

  it("uses the fast way when a printer is chosen", async () => {
    if (process.platform !== "win32") return;
    const contents = fakeWebContents();
    const result = await printPage(contents, { deviceName: "Canon LBP2900", copies: 2, pageSize: "A6" });

    expect(fast.calls).toEqual([expect.objectContaining({ deviceName: "Canon LBP2900", copies: 2 })]);
    expect(contents.calls).toHaveLength(0);
    expect(result).toMatchObject({ success: true, fast: true });
    expect(typeof result.seconds).toBe("number");
  });

  it("falls back to the normal print if the fast way fails", async () => {
    if (process.platform !== "win32") return;
    fast.fail = true;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const contents = fakeWebContents();
    const result = await printPage(contents, { deviceName: "Canon LBP2900", copies: 1, pageSize: "A4" });

    expect(contents.calls).toEqual([expect.objectContaining({ silent: true, deviceName: "Canon LBP2900" })]);
    expect(result).toMatchObject({ success: true });
    expect(result.fast).toBeUndefined();
    warn.mockRestore();
  });

  it("uses the normal print when no printer is chosen", async () => {
    const contents = fakeWebContents();
    await printPage(contents, { deviceName: "", copies: 1, pageSize: "A6" });
    expect(fast.calls).toHaveLength(0);
    expect(contents.calls).toHaveLength(1);
  });
});
