import { describe, expect, it } from "vitest";
import { formatDuration, formatLakh } from "./format";
import { periodRange } from "./period";
import { averageSeconds, buildInsights, daysUsed, savingSplit, timeBySize, weekGrid } from "./summary";

const at = (day, hour = 11) => new Date(2026, 10, day, hour).toISOString();
const bill = (day, items, seconds, printed, saved, total = 1000) => ({ madeAt: at(day), items, seconds, printed, saved, total });

const bills = [
  bill(2, 3, 60, 1, 0),
  bill(2, 8, 120, 1, 1),
  bill(3, 20, 180, 0, 1, 5000),
  bill(10, 4, null, 0, 1),
];
const now = new Date(2026, 10, 24, 18);

describe("insights summary", () => {
  it("averages only bills that were timed", () => {
    expect(averageSeconds(bills)).toBe(120);
    expect(averageSeconds([])).toBeNull();
  });

  it("groups bills by size", () => {
    const [short, medium, long] = timeBySize(bills);
    expect([short.count, medium.count, long.count]).toEqual([2, 1, 1]);
    expect(short.seconds).toBe(60);
    expect(long.seconds).toBe(180);
  });

  it("splits printed and saved bills", () => {
    expect(savingSplit(bills)).toEqual({ printedOnly: 1, both: 1, savedOnly: 2 });
  });

  it("counts each used day once and finds the first one", () => {
    const used = daysUsed(bills);
    expect(used.count).toBe(3);
    expect(used.first.getDate()).toBe(2);
  });

  it("builds the month view with totals and one bar per day", () => {
    const insights = buildInsights(bills, [bill(2, 0, null, 1, 0, 0)], "month", now);
    expect(insights.billCount).toBe(4);
    expect(insights.challanCount).toBe(1);
    expect(insights.total).toBe(8000);
    expect(insights.perBucket).toHaveLength(30);
    expect(insights.perBucket[1].value).toBe(2);
    expect(insights.activeDays).toBe(3);
  });

  it("leaves out bills from other periods", () => {
    const old = [...bills, { ...bill(5, 2, 30, 1, 0), madeAt: new Date(2026, 8, 5).toISOString() }];
    expect(buildInsights(old, [], "month", now).billCount).toBe(4);
    expect(buildInsights(old, [], "year", now).billCount).toBe(5);
    expect(buildInsights(old, [], "day", now).billCount).toBe(0);
  });

  it("makes 12 weeks of 7 days, with days after today left empty", () => {
    const grid = weekGrid(bills, now);
    expect(grid).toHaveLength(12);
    expect(grid.every((week) => week.length === 7)).toBe(true);
    expect(grid[11].some((day) => day.count === null)).toBe(true);
  });

  it("gives each period the right number of chart columns", () => {
    expect(periodRange("day", now).buckets).toHaveLength(24);
    expect(periodRange("week", now).buckets).toHaveLength(7);
    expect(periodRange("year", now).buckets).toHaveLength(12);
  });
});

describe("insights formatting", () => {
  it("shows times and amounts simply", () => {
    expect(formatDuration(97)).toBe("1 min 37 s");
    expect(formatDuration(45)).toBe("45 s");
    expect(formatDuration(null)).toBe("Not timed yet");
    expect(formatLakh(143650)).toBe("₹1.44 L");
    expect(formatLakh(43650)).toBe("₹43,650");
  });
});
