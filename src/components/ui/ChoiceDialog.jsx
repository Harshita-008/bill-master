import { useEffect, useRef } from "react";

// underline the shortcut letter inside the button text
function ButtonLabel({ label, letter }) {
  const at = label.toLowerCase().indexOf(letter);
  if (at === -1) return <span>{label}</span>;
  return <span>{label.slice(0, at)}<u>{label[at]}</u>{label.slice(at + 1)}</span>;
}

// box with a few buttons, each with its own letter key
// arrows / tab move, enter picks, esc picks the first button, no other key reaches the page
export default function ChoiceDialog({ icon: Icon, title, message, hint, className = "", danger = false, choices }) {
  const buttonRefs = useRef([]);

  useEffect(() => {
    buttonRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    const moveFocus = (step) => {
      const at = buttonRefs.current.indexOf(document.activeElement);
      const next = (at + step + choices.length) % choices.length;
      buttonRefs.current[next]?.focus();
    };
    const handleKey = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const key = event.key.toLowerCase();
      const byLetter = choices.find((choice) => choice.letter === key);

      if (byLetter) byLetter.onPick();
      else if (key === "escape") choices[0].onPick();
      else if (key === "arrowright" || (key === "tab" && !event.shiftKey)) moveFocus(1);
      else if (key === "arrowleft" || key === "tab") moveFocus(-1);
      else if (key === "enter") {
        const at = buttonRefs.current.indexOf(document.activeElement);
        (choices[at] || choices[0]).onPick();
      }
    };
    window.addEventListener("keydown", handleKey, true);
    return () => window.removeEventListener("keydown", handleKey, true);
  }, [choices]);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        // keep the click from closing a dialog behind this one
        event.stopPropagation();
        choices[0].onPick();
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
          {choices.map((choice, index) => (
            <button
              key={choice.letter}
              ref={(element) => { buttonRefs.current[index] = element; }}
              type="button"
              className={choice.className}
              onClick={choice.onPick}
            >
              <ButtonLabel label={choice.label} letter={choice.letter} />
            </button>
          ))}
        </div>
        {hint && <p className="dialog-hint">{hint}</p>}
      </section>
    </div>
  );
}
