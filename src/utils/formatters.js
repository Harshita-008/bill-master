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

export function formatDate(value) {
  if (!value) return "—";
  const normalized = String(value).includes("T")
    ? value
    : `${String(value).replace(" ", "T")}Z`;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(normalized));
}

export function formatDateOnly(value) {
  if (!value) return "—";
  const normalized = String(value).includes("T")
    ? value
    : `${String(value).replace(" ", "T")}Z`;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(normalized));
}
