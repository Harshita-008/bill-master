import { useEffect, useRef, useState } from "react";
import { Edit3, Printer, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import PaginatedBill from "../components/bill/PaginatedBill";
import PageHeader from "../components/ui/PageHeader";
import { api } from "../services/api";

export default function BillDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [markError, setMarkError] = useState("");
  const deleteButtonRef = useRef(null);
  const editButtonRef = useRef(null);
  const printButtonRef = useRef(null);

  useEffect(() => {
    api.getBill(id).then(setBill);
  }, [id]);

  const printBill = () => {
    sessionStorage.setItem("billmaster.printDraft", JSON.stringify(bill));
    navigate("/print");
  };

  const removeBill = async () => {
    const confirmed = window.confirm(
      `Delete bill #${String(bill.id).padStart(4, "0")} for ${bill.companyName}? This cannot be undone.`,
    );
    if (!confirmed) return;
    await api.deleteBill(bill.id);
    navigate("/bills", { replace: true });
  };

  const toggleItemMark = async (item) => {
    const nextMarked = !item.isMarked;
    const matchesItem = (candidate) => String(candidate.id) === String(item.id);
    setMarkError("");
    setBill((current) => ({
      ...current,
      items: current.items.map((candidate) => (
        matchesItem(candidate) ? { ...candidate, isMarked: nextMarked } : candidate
      )),
    }));
    try {
      await api.updateBillItemMark(bill.id, item.id, nextMarked);
    } catch (error) {
      setBill((current) => ({
        ...current,
        items: current.items.map((candidate) => (
          matchesItem(candidate) ? { ...candidate, isMarked: !nextMarked } : candidate
        )),
      }));
      setMarkError(error.message || "The item row could not be updated.");
    }
  };

  const moveActionFocus = (event, leftTarget, rightTarget) => {
    if (event.key === "ArrowLeft" && leftTarget) {
      event.preventDefault();
      leftTarget.current?.focus();
    } else if (event.key === "ArrowRight" && rightTarget) {
      event.preventDefault();
      rightTarget.current?.focus();
    }
  };

  if (!bill) return <div className="loading-state">Loading bill…</div>;
  return (
    <div>
      <PageHeader
        eyebrow={`Bill #${String(bill.id).padStart(4, "0")}`}
        title={bill.companyName}
        description="This is the complete bill saved on your device."
        actions={(
          <>
            <button
              ref={deleteButtonRef}
              className="danger-button"
              onClick={removeBill}
              onKeyDown={(event) => moveActionFocus(event, null, editButtonRef)}
            >
              <Trash2 size={17} /> Delete
            </button>
            <button
              ref={editButtonRef}
              className="secondary-button"
              onClick={() => navigate(`/bills/${id}/edit`)}
              onKeyDown={(event) => moveActionFocus(event, deleteButtonRef, printButtonRef)}
            >
              <Edit3 size={17} /> Edit
            </button>
            <button
              ref={printButtonRef}
              className="primary-button"
              autoFocus
              onClick={printBill}
              onKeyDown={(event) => moveActionFocus(event, editButtonRef, null)}
            >
              <Printer size={17} /> Print
            </button>
          </>
        )}
      />
      {markError && <div className="alert" role="alert">{markError}</div>}
      <div
        className="detail-document-wrap bill-detail-scroll"
        role="region"
        aria-label="Scrollable saved bill"
        tabIndex="0"
      >
        <PaginatedBill
          bill={bill}
          pageSize="A4"
          interactiveItemMarks
          onToggleItemMark={toggleItemMark}
        />
      </div>
    </div>
  );
}
