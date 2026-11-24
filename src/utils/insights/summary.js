import { MONTHS, addDays, dayKey, periodRange, startOfDay } from "./period";

export const SIZE_GROUPS = [
  { id: "short", label: "Short", range: "1 to 5 items", min: 0, max: 5 },
  { id: "medium", label: "Medium", range: "6 to 15 items", min: 6, max: 15 },
  { id: "long", label: "Long", range: "16 or more items", min: 16, max: Infinity },
];

const when = (row) => new Date(row.madeAt);

export function inRange(rows, start, end) {
  return rows.filter((row) => when(row) >= start && when(row) < end);
}

export function averageSeconds(rows) {
  const timed = rows.filter((row) => Number(row.seconds) > 0);
  if (!timed.length) return null;
  return Math.round(timed.reduce((sum, row) => sum + Number(row.seconds), 0) / timed.length);
}

export function totalBilled(rows) {
  return rows.reduce((sum, row) => sum + (Number(row.total) || 0), 0);
}

export function countByBucket(rows, buckets) {
  return buckets.map((bucket) => ({ ...bucket, value: inRange(rows, bucket.start, bucket.end).length }));
}

export function timeBySize(rows) {
  return SIZE_GROUPS.map((group) => {
    const inGroup = rows.filter((row) => row.items >= group.min && row.items <= group.max);
    return { ...group, count: inGroup.length, seconds: averageSeconds(inGroup) };
  });
}

// how each bill was finished: printed, saved, or both
export function savingSplit(rows) {
  const printed = (row) => Boolean(Number(row.printed));
  const saved = (row) => Boolean(Number(row.saved));
  return {
    printedOnly: rows.filter((row) => printed(row) && !saved(row)).length,
    both: rows.filter((row) => printed(row) && saved(row)).length,
    savedOnly: rows.filter((row) => !printed(row) && saved(row)).length,
  };
}

// days with at least one bill or challan
export function daysUsed(rows) {
  const days = new Set(rows.map((row) => dayKey(when(row))));
  const first = rows.length ? new Date(Math.min(...rows.map((row) => when(row).getTime()))) : null;
  return { count: days.size, first };
}

// bills per day for the last few weeks, monday first, for the calendar grid
export function weekGrid(rows, now = new Date(), weeks = 12) {
  const today = startOfDay(now);
  const mondayOffset = (today.getDay() + 6) % 7;
  const firstMonday = addDays(today, -mondayOffset - (weeks - 1) * 7);
  const perDay = new Map();
  rows.forEach((row) => perDay.set(dayKey(when(row)), (perDay.get(dayKey(when(row))) || 0) + 1));

  return Array.from({ length: weeks }, (_, week) => Array.from({ length: 7 }, (_, weekday) => {
    const day = addDays(firstMonday, week * 7 + weekday);
    return { day, count: day > today ? null : perDay.get(dayKey(day)) || 0 };
  }));
}

export function monthlyTotals(rows, now = new Date(), months = 6) {
  return Array.from({ length: months }, (_, index) => {
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1 - index), 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    return { label: MONTHS[start.getMonth()], start, value: totalBilled(inRange(rows, start, end)) };
  });
}

// everything the insights page shows for one period
export function buildInsights(bills, challans, period, now = new Date()) {
  const range = periodRange(period, now);
  const periodBills = inRange(bills, range.start, range.end);
  const periodChallans = inRange(challans, range.start, range.end);

  return {
    range,
    billCount: periodBills.length,
    challanCount: periodChallans.length,
    activeDays: daysUsed([...periodBills, ...periodChallans]).count,
    averageSeconds: averageSeconds(periodBills),
    total: totalBilled(periodBills),
    perBucket: countByBucket(periodBills, range.buckets),
    sizes: timeBySize(periodBills),
    saving: savingSplit(periodBills),
    used: daysUsed([...bills, ...challans]),
    grid: weekGrid([...bills, ...challans], now),
    months: monthlyTotals(bills, now),
  };
}
