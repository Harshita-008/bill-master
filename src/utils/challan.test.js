import { describe, expect, it } from "vitest";
import { createEmptyChallan } from "./challan";

describe("createEmptyChallan", () => {
  it("starts with the current local date while leaving it editable", () => {
    const challan = createEmptyChallan(new Date(2026, 7, 6));
    expect(challan).toEqual(expect.objectContaining({
      dateDay: "6",
      dateMonth: "8",
      dateYear: "2026",
    }));
  });
});
