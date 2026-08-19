import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ClipboardList, FilePlus2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import useKeyboardListNavigation from "../hooks/useKeyboardListNavigation";
import { api } from "../services/api";
import { newestFirst } from "../utils/bills";
import { formatDate } from "../utils/formatters";

export default function ChallanHistoryPage() {
  const navigate = useNavigate();
  const [challans, setChallans] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getChallans().then(setChallans).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return challans
      .filter((challan) => (
        [challan.toLine1, challan.toLine2, challan.toLine3, challan.deliveredBy]
          .some((value) => String(value || "").toLocaleLowerCase().includes(term))
      ))
      .sort(newestFirst);
  }, [challans, query]);

  const { rowRefs, moveRowFocus } = useKeyboardListNavigation(filtered.length, loading);

  return (
    <div>
      <PageHeader
        eyebrow="Challan archive"
        title="Saved challans"
        description="Open any saved challan to view, edit, or print it again."
        actions={(
          <button className="primary-button" onClick={() => navigate("/challans/new")}>
            <FilePlus2 size={18} /> New challan
          </button>
        )}
      />
      {!!challans.length && (
        <div className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search challans" />
        </div>
      )}
      {loading ? <div className="loading-state">Loading challans…</div> : !challans.length ? (
        <EmptyState
          icon={ClipboardList}
          title="No saved challans yet"
          description="Challans will appear here after you use Save & print challan."
          action={<button className="primary-button" onClick={() => navigate("/challans/new")}>Create your first challan</button>}
        />
      ) : (
        <div className="bills-list">
          <div className="challan-list-header">
            <span>To</span><span>Date</span><span>Saved</span><span />
          </div>
          {filtered.map((challan, index) => (
            <button
              ref={(element) => { rowRefs.current[index] = element; }}
              className="challan-list-row"
              key={challan.id}
              onClick={() => navigate(`/challans/${challan.id}`)}
              onKeyDown={(event) => moveRowFocus(event, index)}
            >
              <span>{challan.toLine1 || challan.toLine2 || challan.toLine3 || "—"}</span>
              <span>{challan.challanDate || "—"}</span>
              <span>{formatDate(challan.createdAt)}</span>
              <ArrowRight size={18} />
            </button>
          ))}
          {!filtered.length && <p className="no-results">No challans match “{query}”.</p>}
        </div>
      )}
    </div>
  );
}
