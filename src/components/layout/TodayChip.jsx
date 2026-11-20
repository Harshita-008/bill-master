// e.g. "Friday, 20 November"
function todayText() {
  const today = new Date();
  const weekday = today.toLocaleDateString("en-GB", { weekday: "long" });
  const month = today.toLocaleDateString("en-GB", { month: "long" });

  return `${weekday}, ${today.getDate()} ${month}`;
}

export default function TodayChip() {
  return <span className="today-chip">{todayText()}</span>;
}
