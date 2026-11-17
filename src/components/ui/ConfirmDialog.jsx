import { useEffect, useRef } from "react";

const SWITCH_KEYS = ["arrowleft", "arrowright", "tab"];

// yes / no box: y or n, arrows move between them, enter picks, no other key reaches the page
export default function ConfirmDialog({ icon: Icon, title, message, className = "", danger = false, onYes, onNo }) {
  const noButtonRef = useRef(null);
  const yesButtonRef = useRef(null);

  useEffect(() => {
    noButtonRef.current?.focus();
    const handleKey = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const key = event.key.toLowerCase();
      const yesFocused = document.activeElement === yesButtonRef.current;

      if (key === "y") onYes();
      else if (key === "n" || key === "escape") onNo();
      else if (SWITCH_KEYS.includes(key)) {
        (yesFocused ? noButtonRef : yesButtonRef).current?.focus();
      } else if (key === "enter") {
        if (yesFocused) onYes();
        else onNo();
      }
    };
    window.addEventListener("keydown", handleKey, true);
    return () => window.removeEventListener("keydown", handleKey, true);
  }, [onYes, onNo]);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        // keep the click from closing a dialog behind this one
        event.stopPropagation();
        onNo();
      }}
    >
      <section
        className={`ledger-dialog confirm-dialog ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmDialogTitle"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-heading">
          <span className={`dialog-icon ${danger ? "danger-icon" : ""}`.trim()}><Icon size={20} /></span>
          <div>
            <h2 id="confirmDialogTitle">{title}</h2>
            <p>{message}</p>
          </div>
        </div>
        <div className="dialog-actions delete-dialog-actions">
          <button ref={noButtonRef} type="button" className="secondary-button" onClick={onNo}>
            <span><u>N</u>o</span>
          </button>
          <button ref={yesButtonRef} type="button" className={danger ? "danger-button" : "primary-button"} onClick={onYes}>
            <span><u>Y</u>es</span>
          </button>
        </div>
      </section>
    </div>
  );
}
