import { useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";

export default function BulkDeleteDialog({ count, entityName, deleting, onCancel, onConfirm }) {
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    cancelButtonRef.current?.focus();
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCancel();
      } else if (event.key === "Delete" && !deleting) {
        event.preventDefault();
        event.stopPropagation();
        onConfirm();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [deleting, onCancel, onConfirm]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        className="ledger-dialog delete-ledger-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulkDeleteTitle"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-heading">
          <span className="dialog-icon danger-icon"><Trash2 size={20} /></span>
          <div>
            <h2 id="bulkDeleteTitle">Delete {count} selected {entityName}{count === 1 ? "" : "s"}?</h2>
            <p>This removes the selected names from future bill suggestions.</p>
          </div>
        </div>
        <div className="dialog-actions delete-dialog-actions">
          <button ref={cancelButtonRef} type="button" className="secondary-button" onClick={onCancel} disabled={deleting}>
            Cancel
          </button>
          <button type="button" className="danger-button" onClick={onConfirm} disabled={deleting}>
            <Trash2 size={17} /> {deleting ? "Deleting…" : `Delete ${count}`}
          </button>
        </div>
      </section>
    </div>
  );
}
