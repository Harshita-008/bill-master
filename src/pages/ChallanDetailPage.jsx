import { useEffect, useRef, useState } from "react";
import { Edit3, Printer, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ChallanDocument from "../components/challan/ChallanDocument";
import PageHeader from "../components/ui/PageHeader";
import { api } from "../services/api";

export default function ChallanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challan, setChallan] = useState(null);
  const deleteButtonRef = useRef(null);
  const editButtonRef = useRef(null);
  const printButtonRef = useRef(null);

  useEffect(() => {
    api.getChallan(id).then(setChallan);
  }, [id]);

  if (!challan) return <div className="loading-state">Loading challan…</div>;

  const printChallan = () => {
    sessionStorage.setItem("billmaster.challanPrintDraft", JSON.stringify(challan));
    navigate("/challan-print", { state: { returnTo: `/challans/${id}` } });
  };

  const removeChallan = async () => {
    const confirmed = window.confirm(`Delete challan #${String(challan.id).padStart(4, "0")}? This cannot be undone.`);
    if (!confirmed) return;
    await api.deleteChallan(challan.id);
    navigate("/challans", { replace: true });
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

  return (
    <div>
      <PageHeader
        eyebrow={`Challan #${String(challan.id).padStart(4, "0")}`}
        title={challan.toLine1 || "Saved challan"}
        description="This challan is stored locally on your device."
        actions={(
          <>
            <button
              ref={deleteButtonRef}
              className="danger-button"
              onClick={removeChallan}
              onKeyDown={(event) => moveActionFocus(event, null, editButtonRef)}
            ><Trash2 size={17} /> Delete</button>
            <button
              ref={editButtonRef}
              className="secondary-button"
              onClick={() => navigate(`/challans/${id}/edit`)}
              onKeyDown={(event) => moveActionFocus(event, deleteButtonRef, printButtonRef)}
            ><Edit3 size={17} /> Edit</button>
            <button
              ref={printButtonRef}
              className="primary-button"
              autoFocus
              onClick={printChallan}
              onKeyDown={(event) => moveActionFocus(event, editButtonRef, null)}
            ><Printer size={17} /> Print</button>
          </>
        )}
      />
      <div className="detail-document-wrap"><ChallanDocument challan={challan} pageSize="A4" /></div>
    </div>
  );
}
