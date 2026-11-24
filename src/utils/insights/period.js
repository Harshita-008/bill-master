export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const PERIODS = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
];

export function startOfDay(date) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

export function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

// same calendar day in local time
export function dayKey(date) {
  const day = new Date(date);
  return `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`;
}

export function shortDate(date) {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function hourBuckets(today) {
  return Array.from({ length: 24 }, (_, hour) => {
    const start = new Date(today);
    start.setHours(hour);
    const end = new Date(start);
    end.setHours(hour + 1);
    const label = `${hour % 12 || 12} ${hour < 12 ? "am" : "pm"}`;
    return { start, end, label, axis: hour % 3 === 0 ? label : "" };
  });
}

function dayBuckets(first, count, axisFor) {
  return Array.from({ length: count }, (_, index) => {
    const start = addDays(first, index);
    return { start, end: addDays(start, 1), label: shortDate(start), axis: axisFor(start, index) };
  });
}

function monthBuckets(year) {
  return MONTHS.map((name, month) => ({
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 1),
    label: `${name} ${year}`,
    axis: name,
  }));
}

// date range, chart columns and wording for the chosen period
export function periodRange(period, now = new Date()) {
  const today = startOfDay(now);

  if (period === "day") {
    return { start: today, end: addDays(today, 1), title: "today", chart: "Bills made per hour, today", buckets: hourBuckets(today) };
  }
  if (period === "week") {
    const start = addDays(today, -6);
    const buckets = dayBuckets(start, 7, (day) => WEEKDAYS[day.getDay()]);
    return { start, end: addDays(today, 1), title: "the last 7 days", chart: "Bills made per day, last 7 days", buckets };
  }
  if (period === "year") {
    const year = today.getFullYear();
    const start = new Date(year, 0, 1);
    return { start, end: new Date(year + 1, 0, 1), title: String(year), chart: `Bills made per month, ${year}`, buckets: monthBuckets(year) };
  }

  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const days = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const buckets = dayBuckets(start, days, (day, index) => (index === 0 || (index + 1) % 5 === 0 ? String(index + 1) : ""));
  const month = `${MONTHS[today.getMonth()]} ${today.getFullYear()}`;
  return { start, end, title: month, chart: `Bills made per day, ${month}`, buckets };
}

