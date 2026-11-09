import { useEffect, useRef } from "react";
import { LogOut } from "lucide-react";

const SWITCH_KEYS = ["arrowleft", "arrowright", "tab"];

// y = exit, n or esc = stay, arrows move between no and yes
export default function ExitDialog({ onYes, onNo }) {
  const noButtonRef = useRef(null);
  const yesButtonRef = useRef(null);

  useEffect(() => {
    noButtonRef.current?.focus();
    const handleKey = (event) => {
      // the dialog takes every key, nothing reaches the page behind it
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
    <div className="modal-backdrop" role="presentation" onMouseDown={onNo}>
      <section
        className="ledger-dialog exit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exitDialogTitle"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-heading">
          <span className="dialog-icon"><LogOut size={20} /></span>
          <div>
            <h2 id="exitDialogTitle">Do you want to exit?</h2>
            <p>Anything not saved on this bill will be lost.</p>
          </div>
        </div>
        <div className="dialog-actions delete-dialog-actions">
          <button ref={noButtonRef} type="button" className="secondary-button" onClick={onNo}>
            <span><u>N</u>o</span>
          </button>
          <button ref={yesButtonRef} type="button" className="primary-button" onClick={onYes}>
            <span><u>Y</u>es</span>
          </button>
        </div>
      </section>
    </div>
  );
}
