import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, FilePlus2, ReceiptText, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import useKeyboardListNavigation from "../hooks/useKeyboardListNavigation";
import { api } from "../services/api";
import { formatCurrency, formatDate } from "../utils/formatters";
import { groupBillsByCompany } from "../utils/bills";

export default function BillsHistoryPage() {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBills().then(setBills).finally(() => setLoading(false));
  }, []);

  const companies = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return groupBillsByCompany(bills).filter((group) => (
      group.companyName.toLocaleLowerCase().includes(term)
    ));
  }, [bills, query]);
  const { rowRefs, moveRowFocus } = useKeyboardListNavigation(companies.length, loading);

  return (
    <div>
      <PageHeader
        eyebrow="Bill archive"
        title="Ledgers"
        description="Choose a ledger to view all of its bills, newest first."
        actions={(
          <button className="primary-button" onClick={() => navigate("/bills/new")}>
            <FilePlus2 size={18} /> New bill
          </button>
        )}
      />
      {!!bills.length && (
        <div className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ledger name" />
        </div>
      )}
      {loading ? <div className="loading-state">Loading bills…</div> : !bills.length ? (
        <EmptyState
          icon={ReceiptText}
          title="No saved bills yet"
          description="Ledgers will appear here after you save their first bill."
          action={<button className="primary-button" onClick={() => navigate("/bills/new")}>Create your first bill</button>}
        />
      ) : (
        <div className="bills-list company-list">
          <div className="company-list-header">
            <span>Ledger</span><span>Bills</span><span>Latest bill</span><span>Total</span><span />
          </div>
          {companies.map((group, index) => (
            <button
              ref={(element) => { rowRefs.current[index] = element; }}
              className="company-list-row"
              key={group.key}
              onClick={() => navigate(`/bills/company/${encodeURIComponent(group.companyName)}`)}
              onKeyDown={(event) => moveRowFocus(event, index)}
            >
              <span className="company-cell">
                <span className="company-avatar"><Building2 size={17} /></span>
                <strong>{group.companyName}</strong>
              </span>
              <span>{group.bills.length}</span>
              <span>{formatDate(group.latestAt)}</span>
              <strong>{formatCurrency(group.total)}</strong>
              <ArrowRight size={18} />
            </button>
          ))}
          {!companies.length && <p className="no-results">No ledgers match “{query}”.</p>}
        </div>
      )}
    </div>
  );
}
