import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, FilePlus2, Save } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import BillForm from "../components/bill/BillForm";
import PageHeader from "../components/ui/PageHeader";
import { api } from "../services/api";
import { hydrateBill } from "../utils/bill";
import { focusAtStart } from "../utils/focus";

export default function BillEditorPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const printButtonRef = useRef(null);
  const saveButtonRef = useRef(null);
  const lastChargeInputRef = useRef(null);
  const [currentBill, setCurrentBill] = useState(null);
  const [currentDraft, setCurrentDraft] = useState(null);
  const handleBillChange = useCallback((bill) => setCurrentBill(bill), []);
  const handleDraftChange = useCallback((bill) => setCurrentDraft(bill), []);
  const [initialBill, setInitialBill] = useState(() => {
    if (location.state?.fromPreview) {
      try {
        const draft = JSON.parse(
          sessionStorage.getItem("billmaster.editorDraft")
          || sessionStorage.getItem("billmaster.printDraft"),
        );
        if (draft) return hydrateBill(draft);
      } catch {
        // Fall through to a fresh bill or a database load.
      }
    }
    return id ? null : undefined;
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formVersion, setFormVersion] = useState(0);
  const [suggestionHost, setSuggestionHost] = useState(null);

  useEffect(() => {
    if (!id || initialBill) return;
    api.getBill(id).then((bill) => {
      if (bill) setInitialBill(hydrateBill(bill));
      else setError("This bill could not be found.");
    });
  }, [id, initialBill]);

  const validate = () => {
    const bill = currentBill;
    if (!bill?.companyName.trim()) return "Enter a ledger name.";
    if (!bill.items.length) return "Add at least one item.";
    if (bill.items.some((item) => !item.itemName.trim())) return "Every item needs a name.";
    if (bill.items.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1)) {
      return "Item quantities must be positive whole numbers.";
    }
    return "";
  };

  const openPreview = (bill, editorDraft, returnTo = location.pathname) => {
    sessionStorage.setItem("billmaster.printDraft", JSON.stringify(bill));
    sessionStorage.setItem("billmaster.editorDraft", JSON.stringify(editorDraft));
    navigate("/print", { state: { returnTo } });
  };

  const handlePrintOnly = () => {
    const message = validate();
    if (message) return setError(message);
    setError("");
    openPreview(currentBill, currentDraft);
  };

  const handleSaveAndPrint = async () => {
    const message = validate();
    if (message) return setError(message);
    setSaving(true);
    setError("");
    try {
      const existingId = id ? Number(id) : Number(currentDraft?.id) || undefined;
      const bill = { ...currentBill, id: existingId };
      const result = await api.saveBill(bill);
      const savedBill = { ...bill, id: result.billId, createdAt: initialBill?.createdAt };
      const savedDraft = { ...currentDraft, id: result.billId, createdAt: initialBill?.createdAt };
      openPreview(savedBill, savedDraft, `/bills/${result.billId}/edit`);
    } catch (saveError) {
      setError(saveError.message || "The bill could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const startFreshBill = () => {
    sessionStorage.removeItem("billmaster.printDraft");
    sessionStorage.removeItem("billmaster.editorDraft");
    setInitialBill(undefined);
    setCurrentBill(null);
    setCurrentDraft(null);
    setError("");
    setFormVersion((version) => version + 1);
    navigate("/bills/new", { replace: true, state: { fresh: true } });
  };

  if (id && initialBill === null && !error) return <div className="loading-state">Loading bill…</div>;

  return (
    <div className="editor-workspace">
      <PageHeader
        eyebrow={id ? `Editing bill #${String(id).padStart(4, "0")}` : "New bill"}
        title={id ? "Update your bill" : "Create a new bill"}
        actions={(
          <button className="primary-button" type="button" onClick={startFreshBill}>
            <FilePlus2 size={18} /> New bill
          </button>
        )}
      />
      {error && <div className="alert" role="alert">{error}</div>}
      <div className="editor-columns">
        <div className="editor-page">
        {!id || initialBill ? (
          <BillForm
            key={formVersion}
            initialBill={initialBill}
            onBillChange={handleBillChange}
            onDraftChange={handleDraftChange}
            printButtonRef={printButtonRef}
            lastChargeInputRef={lastChargeInputRef}
            suggestionHost={suggestionHost}
          >
          <div className="editor-actions">
            <button
              ref={printButtonRef}
              className="secondary-button"
              type="button"
              onClick={handlePrintOnly}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  saveButtonRef.current?.focus();
                } else if (event.key === "Backspace") {
                  event.preventDefault();
                  focusAtStart(lastChargeInputRef.current);
                }
              }}
            >
              <Eye size={18} /> Print
            </button>
            <button
              ref={saveButtonRef}
              className="primary-button"
              type="button"
              onClick={handleSaveAndPrint}
              disabled={saving}
              onKeyDown={(event) => {
                if (event.key === "Backspace" || event.key === "ArrowLeft") {
                  event.preventDefault();
                  printButtonRef.current?.focus();
                }
              }}
            >
              <Save size={18} /> {saving ? "Saving…" : "Save & print"}
            </button>
          </div>
          </BillForm>
        ) : null}
      </div>
        <aside className="suggestion-rail" ref={setSuggestionHost} />
      </div>
    </div>
  );
}
