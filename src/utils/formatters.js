export function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export function formatAmount(value) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export function formatAmountOrBlank(value) {
  return Number(value) ? formatAmount(value) : "";
}

// sqlite saves "2026-11-09 10:00:00" in utc
export function parseDate(value) {
  const text = String(value);
  return new Date(text.includes("T") ? text : `${text.replace(" ", "T")}Z`);
}

export function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parseDate(value));
}

export function formatDateOnly(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parseDate(value));
}
