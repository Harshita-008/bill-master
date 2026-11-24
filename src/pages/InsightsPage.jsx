import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import BarChart from "../components/insights/BarChart";
import DaysGrid from "../components/insights/DaysGrid";
import InsightCard from "../components/insights/InsightCard";
import PeriodSwitch from "../components/insights/PeriodSwitch";
import SavingRing from "../components/insights/SavingRing";
import SizeTimes from "../components/insights/SizeTimes";
import StatTiles from "../components/insights/StatTiles";
import PageHeader from "../components/ui/PageHeader";
import { api } from "../services/api";
import { formatLakh } from "../utils/insights/format";
import { shortDate } from "../utils/insights/period";
import { buildInsights } from "../utils/insights/summary";

export default function InsightsPage() {
  const [period, setPeriod] = useState("month");
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    Promise.all([api.listActivity("bill"), api.listActivity("challan")])
      .then(([bills, challans]) => setActivity({ bills, challans }));
  }, []);

  const insights = useMemo(
    () => activity && buildInsights(activity.bills, activity.challans, period),
    [activity, period],
  );

  if (!insights) return <div className="loading-state">Loading insights…</div>;

  const since = insights.used.first ? `since ${shortDate(insights.used.first)}` : "from today";
  const dayBars = insights.perBucket.map((bucket) => ({
    key: bucket.label,
    value: bucket.value,
    axis: bucket.axis,
    tip: `${bucket.label}: ${bucket.value} bills`,
  }));
  const monthBars = insights.months.map((month) => ({
    key: month.start.toISOString(),
    value: month.value,
    axis: month.label,
    tip: `${month.label}: ${formatLakh(month.value)}`,
  }));

  return (
    <div className="insights">
      <PageHeader
        eyebrow="Insights"
        title="How BillMaster is used"
        description={`Recorded on this laptop ${since}. Bills count when they are first printed or saved, even if deleted later.`}
        actions={(
          <>
            <PeriodSwitch value={period} onChange={setPeriod} />
            <button className="primary-button no-print" type="button" onClick={() => api.exportInsights()}>
              <Download size={17} /> Export report
            </button>
          </>
        )}
      />

      <StatTiles insights={insights} />

      <div className="insights-row insights-row-top">
        <InsightCard title={insights.range.chart}>
          <BarChart bars={dayBars} />
        </InsightCard>
        <InsightCard title="Average time by bill size" note="From opening a new bill to its first print or save">
          <SizeTimes sizes={insights.sizes} />
        </InsightCard>
      </div>

      <div className="insights-row insights-row-bottom">
        <InsightCard title="Printed vs saved" note={`Bills made in ${insights.range.title}`}>
          <SavingRing saving={insights.saving} />
        </InsightCard>
        <InsightCard title="Days used, last 12 weeks" note="Each square is a day, darker means more made">
          <DaysGrid weeks={insights.grid} />
        </InsightCard>
        <InsightCard title="Total billed per month" note="Last 6 months">
          <BarChart bars={monthBars} format={formatLakh} showAll />
        </InsightCard>
      </div>
    </div>
  );
}
