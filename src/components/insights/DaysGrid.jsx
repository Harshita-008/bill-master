import { shortDate } from "../../utils/insights/period";

const DAY_NAMES = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

// 0 = no bills, 4 = busiest
function levelOf(count) {
  if (!count) return 0;
  if (count <= 3) return 1;
  if (count <= 8) return 2;
  if (count <= 15) return 3;
  return 4;
}

export default function DaysGrid({ weeks }) {
  return (
    <div className="days-grid">
      <div className="days-names">
        {DAY_NAMES.map((name, index) => <span key={index}>{name}</span>)}
      </div>
      <div className="days-cells">
        {weeks.flat().map(({ day, count }) => (
          <span
            key={day.toISOString()}
            className={count == null ? "day-cell future" : `day-cell level-${levelOf(count)}`}
            title={count == null ? "" : `${shortDate(day)}: ${count} made`}
          />
        ))}
      </div>
      <div className="days-legend">
        Fewer
        {[0, 1, 2, 3, 4].map((level) => <span key={level} className={`day-cell level-${level}`} />)}
        More
      </div>
    </div>
  );
}
