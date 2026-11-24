import { afterEach, describe, expect, it } from "vitest";
import { api } from "../services/api";
import { activeSeconds, beginEditorSession, markActive, readSession, startSession } from "./activitySession";
import { recordActivity } from "./recordActivity";

afterEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

describe("bill timing", () => {
  it("counts working time and skips breaks longer than 2 minutes", () => {
    startSession("bill", 0);
    markActive("bill", 30000);
    markActive("bill", 60000);
    markActive("bill", 60000 + 10 * 60000);
    markActive("bill", 60000 + 10 * 60000 + 20000);
    expect(activeSeconds("bill")).toBe(80);
  });

  it("times a new bill but not an old one opened for editing", () => {
    beginEditorSession("bill", false, false);
    expect(readSession("bill")).not.toBeNull();
    beginEditorSession("bill", true, false);
    expect(readSession("bill")).toBeNull();
  });

  it("keeps the same bill when coming back from the print screen", () => {
    startSession("bill");
    const before = readSession("bill").id;
    beginEditorSession("bill", false, true);
    expect(readSession("bill").id).toBe(before);
  });
});

describe("activity log", () => {
  it("counts a bill once even when printed again and then saved", async () => {
    startSession("bill");
    await recordActivity("bill", "print", { items: 4, total: 5550 });
    await recordActivity("bill", "print", { items: 4, total: 5550 });
    await recordActivity("bill", "save", { items: 4, total: 5550, recordId: 7 });

    const rows = await api.listActivity("bill");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ items: 4, total: 5550, printed: true, saved: true });
  });

  it("does not count prints of a saved bill opened from the archive", async () => {
    await recordActivity("bill", "print", { items: 2, total: 100 });
    expect(await api.listActivity("bill")).toHaveLength(0);
  });
});
