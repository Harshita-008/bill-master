import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, FilePlus2, ReceiptText } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import useKeyboardListNavigation from "../hooks/useKeyboardListNavigation";
import { api } from "../services/api";
import { newestFirst, normalizeCompanyName } from "../utils/bills";
import { formatCurrency, formatDate } from "../utils/formatters";

export default function CompanyBillsPage() {
  const { companyName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [allBills, setAllBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const decodedName = companyName;

  useEffect(() => {
    api.getBills().then(setAllBills).finally(() => setLoading(false));
  }, []);

  const bills = useMemo(() => allBills
    .filter((bill) => normalizeCompanyName(bill.companyName) === normalizeCompanyName(decodedName))
    .sort(newestFirst), [allBills, decodedName]);

  const displayName = bills[0]?.companyName || decodedName;
  const companyTotal = bills.reduce((sum, bill) => sum + Number(bill.grandTotal || 0), 0);
  const { rowRefs, moveRowFocus } = useKeyboardListNavigation(bills.length, loading);

  return (
    <div>
      <PageHeader
        eyebrow={`${bills.length} saved ${bills.length === 1 ? "bill" : "bills"}`}
        title={displayName}
        description="Bills are ordered from newest to oldest."
        actions={(
          <>
            <button className="secondary-button" onClick={() => navigate("/bills")}>
              <ArrowLeft size={17} /> Ledgers
            </button>
            <button className="primary-button" onClick={() => navigate("/bills/new")}>
              <FilePlus2 size={17} /> New bill
            </button>
          </>
        )}
      />
      {loading ? <div className="loading-state">Loading bills…</div> : !bills.length ? (
        <EmptyState icon={ReceiptText} title="No bills found" description="There are no saved bills for this ledger." />
      ) : (
        <div className="bills-list company-bills-list">
          <div className="company-bills-header">
            <span>Created</span><span>Items</span><span>Charges</span><span>Total</span><span />
          </div>
          {bills.map((bill, index) => (
            <button
              ref={(element) => { rowRefs.current[index] = element; }}
              className="company-bill-row"
              key={bill.id}
              onClick={() => navigate(`/bills/${bill.id}`, { state: { returnTo: location.pathname } })}
              onKeyDown={(event) => moveRowFocus(event, index)}
            >
              <span>{formatDate(bill.createdAt)}</span>
              <span>{formatCurrency(bill.itemsTotal)}</span>
              <span>{formatCurrency(bill.chargesTotal)}</span>
              <strong>{formatCurrency(bill.grandTotal)}</strong>
              <ArrowRight size={18} />
            </button>
          ))}
          <div className="company-bills-total">
            <strong>All bills total</strong>
            <strong>{formatCurrency(companyTotal)}</strong>
            <span />
          </div>
        </div>
      )}
    </div>
  );
}
