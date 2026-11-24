const RADIUS = 70;
const CIRCLE = 2 * Math.PI * RADIUS;

// slices drawn one after another around the ring, with a small gap between them
function toSlices(parts, total) {
  let used = 0;
  return parts.map((part) => {
    const length = total ? (part.count / total) * CIRCLE : 0;
    const slice = { ...part, dash: `${Math.max(0, length - 3)} ${CIRCLE}`, offset: -used };
    used += length;
    return slice;
  });
}

export default function SavingRing({ saving }) {
  const parts = [
    { label: "Printed only", count: saving.printedOnly, color: "var(--series-1)" },
    { label: "Printed and saved", count: saving.both, color: "var(--series-2)" },
    { label: "Saved only", count: saving.savedOnly, color: "var(--series-3)" },
  ];
  const total = parts.reduce((sum, part) => sum + part.count, 0);
  const share = (count) => (total ? Math.round((count / total) * 100) : 0);

  return (
    <div className="saving-ring">
      <svg viewBox="0 0 190 190" role="img" aria-label={parts.map((part) => `${part.label} ${part.count}`).join(", ")}>
        <circle className="ring-track" cx="95" cy="95" r={RADIUS} />
        <g transform="rotate(-90 95 95)">
          {toSlices(parts, total).map((slice) => (
            <circle
              key={slice.label}
              cx="95"
              cy="95"
              r={RADIUS}
              fill="none"
              stroke={slice.color}
              strokeWidth="26"
              strokeDasharray={slice.dash}
              strokeDashoffset={slice.offset}
            >
              <title>{`${slice.label}: ${slice.count}`}</title>
            </circle>
          ))}
        </g>
        <text x="95" y="92" className="ring-total">{total}</text>
        <text x="95" y="114" className="ring-caption">bills</text>
      </svg>

      <ul className="ring-legend">
        {parts.map((part) => (
          <li key={part.label}>
            <span className="ring-swatch" style={{ background: part.color }} />
            <span>
              <strong>{share(part.count)}%</strong>
              <small>{part.label}, {part.count}</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
