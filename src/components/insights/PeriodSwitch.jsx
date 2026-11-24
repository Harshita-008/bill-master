import { PERIODS } from "../../utils/insights/period";

export default function PeriodSwitch({ value, onChange }) {
  return (
    <div className="period-switch" role="group" aria-label="Period">
      {PERIODS.map((period) => (
        <button
          key={period.id}
          type="button"
          className={period.id === value ? "active" : ""}
          aria-pressed={period.id === value}
          onClick={() => onChange(period.id)}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
