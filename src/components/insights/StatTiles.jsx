import { formatCurrency } from "../../utils/formatters";
import { formatDuration, formatLakh, plural } from "../../utils/insights/format";
import { shortDate } from "../../utils/insights/period";

export default function StatTiles({ insights }) {
  const { range, used } = insights;
  const tiles = [
    { label: "Bills made", value: insights.billCount, note: `In ${range.title}, ${plural(insights.activeDays, "working day")}` },
    { label: "Challans made", value: insights.challanCount, note: `In ${range.title}` },
    { label: "Average time per bill", value: formatDuration(insights.averageSeconds), note: "By hand it took 5 to 7 min" },
    { label: "Days used", value: used.count, note: used.first ? `Since ${shortDate(used.first)}` : "No bills yet" },
    { label: "Total billed", value: formatLakh(insights.total), note: `In ${range.title}, ${formatCurrency(insights.total)}` },
  ];

  return (
    <section className="stat-tiles" aria-label="Summary">
      {tiles.map((tile) => (
        <div className="stat-tile" key={tile.label}>
          <span>{tile.label}</span>
          <strong>{tile.value}</strong>
          <small>{tile.note}</small>
        </div>
      ))}
    </section>
  );
}
