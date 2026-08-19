import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, FilePlus2, Save } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ChallanForm from "../components/challan/ChallanForm";
import PageHeader from "../components/ui/PageHeader";
import { api } from "../services/api";
import { hydrateChallan } from "../utils/challan";

const DRAFT_KEY = "billmaster.challanEditorDraft";
const PRINT_KEY = "billmaster.challanPrintDraft";

export default function ChallanEditorPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const printButtonRef = useRef(null);
  const saveButtonRef = useRef(null);
  const [initialChallan, setInitialChallan] = useState(() => {
    if (location.state?.fromPreview) {
      try {
        const draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY));
        if (draft) return draft;
      } catch {
        // Start fresh when a stored draft is invalid.
      }
    }
    return id ? null : undefined;
  });
  const [prepared, setPrepared] = useState(null);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formVersion, setFormVersion] = useState(0);

  useEffect(() => {
    if (!id || initialChallan) return;
    api.getChallan(id).then((challan) => {
      if (challan) setInitialChallan(hydrateChallan(challan));
      else setError("This challan could not be found.");
    });
  }, [id, initialChallan]);

  const handleChange = useCallback((nextPrepared, nextDraft) => {
    setPrepared(nextPrepared);
    setDraft(nextDraft);
  }, []);

  const openPreview = (challan, editorDraft, returnTo = location.pathname) => {
    sessionStorage.setItem(PRINT_KEY, JSON.stringify(challan));
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(editorDraft));
    navigate("/challan-print", { state: { returnTo } });
  };

  const printOnly = () => openPreview(prepared, draft);

  const saveAndPrint = async () => {
    if (!prepared || saving) return;
    setSaving(true);
    setError("");
    try {
      const existingId = id ? Number(id) : Number(draft?.id) || undefined;
      const result = await api.saveChallan({ ...prepared, id: existingId });
      const saved = {
        ...prepared,
        id: result.challanId,
        createdAt: initialChallan?.createdAt,
      };
      const savedDraft = { ...draft, id: result.challanId, createdAt: initialChallan?.createdAt };
      const returnTo = id ? `/challans/${result.challanId}/edit` : "/challans/new";
      openPreview(saved, savedDraft, returnTo);
    } catch (saveError) {
      setError(saveError.message || "The challan could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const startFresh = () => {
    sessionStorage.removeItem(DRAFT_KEY);
    sessionStorage.removeItem(PRINT_KEY);
    setInitialChallan(undefined);
    setPrepared(null);
    setDraft(null);
    setError("");
    setFormVersion((version) => version + 1);
    navigate("/challans/new", { replace: true, state: { fresh: true } });
  };

  if (id && initialChallan === null && !error) return <div className="loading-state">Loading challan…</div>;

  return (
    <div className="challan-page">
      <PageHeader
        eyebrow={id ? `Editing challan #${String(id).padStart(4, "0")}` : "New challan"}
        title={id ? "Update challan" : "Create a challan"}
        actions={(
          <button className="primary-button" type="button" onClick={startFresh}>
            <FilePlus2 size={18} /> New challan
          </button>
        )}
      />
      {error && <div className="alert" role="alert">{error}</div>}
      {!id || initialChallan ? (
        <ChallanForm
          key={formVersion}
          initialChallan={initialChallan}
          onChange={handleChange}
          printButtonRef={printButtonRef}
        >
          <div className="challan-editor-actions">
            <button
              ref={printButtonRef}
              className="secondary-button"
              type="button"
              onClick={printOnly}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  saveButtonRef.current?.focus();
                }
              }}
            >
              <Eye size={18} /> Print challan
            </button>
            <button
              ref={saveButtonRef}
              className="primary-button"
              type="button"
              onClick={saveAndPrint}
              disabled={saving}
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  printButtonRef.current?.focus();
                }
              }}
            >
              <Save size={18} /> {saving ? "Saving…" : "Save & print challan"}
            </button>
          </div>
        </ChallanForm>
      ) : null}
    </div>
  );
}
