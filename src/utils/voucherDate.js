import { parseDate } from "./formatters.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// "09-Nov-26" and "Monday", like tally
export function formatVoucherDate(value) {
  const date = value ? parseDate(value) : new Date();
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return {
    date: `${day}-${MONTHS[date.getMonth()]}-${year}`,
    weekday: DAYS[date.getDay()],
  };
}
