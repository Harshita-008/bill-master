// round the top of the scale up to a tidy number
function niceMax(value) {
  if (value <= 5) return 5;
  const step = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / step) * step;
}

// bars: [{ key, value, axis, tip }], only the tallest bar shows its number unless showAll
export default function BarChart({ bars, format = String, showAll = false }) {
  const tallest = Math.max(0, ...bars.map((bar) => bar.value));
  const top = niceMax(tallest);
  const lines = [top, top / 2, 0];

  return (
    <div className="bar-chart">
      <div className="bar-plot">
        {lines.map((line) => (
          <div className="bar-line" key={line} style={{ bottom: `${(line / top) * 100}%` }}>
            <span>{format(line)}</span>
          </div>
        ))}
        <div className="bar-columns">
          {bars.map((bar) => (
            <div className="bar-column" key={bar.key} title={bar.tip}>
              <span className="bar-value">
                {bar.value > 0 && (showAll || bar.value === tallest) ? format(bar.value) : ""}
              </span>
              <div className="bar" style={{ height: `${(bar.value / top) * 100}%` }} />
            </div>
          ))}
        </div>
      </div>
      <div className="bar-axis">
        {bars.map((bar) => <span key={bar.key}>{bar.axis}</span>)}
      </div>
    </div>
  );
}
