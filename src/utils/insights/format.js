// 97 seconds becomes "1 min 37 s"
export function formatDuration(seconds) {
  if (seconds == null) return "Not timed yet";
  if (seconds < 60) return `${seconds} s`;
  return `${Math.floor(seconds / 60)} min ${seconds % 60} s`;
}

// big amounts in lakh, like "₹1.44 L"
export function formatLakh(amount) {
  const value = Number(amount) || 0;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}
