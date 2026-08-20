import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("electron/database.js", "utf8");

describe("saved bill item notes", () => {
  it("migrates, writes, and reads the note column", () => {
    expect(source).toContain("note TEXT NOT NULL DEFAULT ''");
    expect(source).toContain("ALTER TABLE bill_items ADD COLUMN note TEXT NOT NULL DEFAULT ''");
    expect(source).toContain("unit, note, is_marked, amount");
    expect(source).toContain("unit AS per, note,");
  });

  it("migrates, writes, reads, and updates the saved red-row status", () => {
    expect(source).toContain("is_marked INTEGER NOT NULL DEFAULT 0");
    expect(source).toContain("ALTER TABLE bill_items ADD COLUMN is_marked INTEGER NOT NULL DEFAULT 0");
    expect(source).toContain("unit, note, is_marked, amount");
    expect(source).toContain("is_marked AS isMarked, amount");
    expect(source).toContain("export function updateBillItemMark");
  });
});
