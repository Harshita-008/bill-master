import { formatDuration, plural } from "../../utils/insights/format";

export default function SizeTimes({ sizes }) {
  const longest = Math.max(60, ...sizes.map((size) => size.seconds || 0));

  return (
    <div className="size-times">
      {sizes.map((size) => (
        <div className="size-row" key={size.id} title={`${size.label} bills: ${plural(size.count, "bill")}`}>
          <div className="size-row-head">
            <span><strong>{size.label}</strong> {size.range}</span>
            <strong>{formatDuration(size.seconds)}</strong>
          </div>
          <div className="size-track">
            <div className="size-bar" style={{ width: `${((size.seconds || 0) / longest) * 100}%` }} />
          </div>
          <small>{plural(size.count, "bill")}</small>
        </div>
      ))}
    </div>
  );
}
