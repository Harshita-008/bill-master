import { useRef } from "react";
import { Trash2 } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";
import { clearOnEscape, focusAtStart, moveBackAtStart } from "../../utils/focus";

export default function ChargesSection({
  charges,
  total,
  onUpdate,
  onAdd,
  onRemove,
  firstInputRef,
  previousInputRef,
  lastInputRef,
  printButtonRef,
}) {
  const rowRefs = useRef([]);

  const setCellRef = (index, cell, element) => {
    if (!rowRefs.current[index]) rowRefs.current[index] = {};
    rowRefs.current[index][cell] = element;
    if (cell === "name" && index === 0) firstInputRef.current = element;
    if (index === charges.length - 1) {
      const lastChargeIsEmpty = !charges[index]?.name.trim();
      if (cell === "name" && lastChargeIsEmpty) lastInputRef.current = element;
      if (cell === "amount" && !lastChargeIsEmpty) lastInputRef.current = element;
    }
  };

  const addAndFocus = () => {
    onAdd();
    setTimeout(() => focusAtStart(rowRefs.current[charges.length]?.name), 0);
  };

  const finishRow = (charge, index) => {
    if (!charge.name.trim()) {
      printButtonRef.current?.focus();
    } else if (index < charges.length - 1) {
      focusAtStart(rowRefs.current[index + 1]?.name);
    } else {
      addAndFocus();
    }
  };

  return (
    <section className="bill-section charges-section" aria-label="Optional additional charges">
      <div className="bill-grid grid-header charges-grid">
        <span>Charge name</span><span>Amount</span><span />
      </div>
      <div className="rows">
        {charges.map((charge, index) => (
            <div className="bill-grid bill-row charges-grid" key={charge.key}>
              <input
                ref={(element) => setCellRef(index, "name", element)}
                value={charge.name}
                aria-label={`Charge name ${index + 1}`}
                onChange={(event) => onUpdate(charge.key, "name", event.target.value)}
                onKeyDown={(event) => {
                  if (clearOnEscape(event, () => onUpdate(charge.key, "name", ""))) return;
                  const previousTarget = index === 0
                    ? previousInputRef.current
                    : rowRefs.current[index - 1]?.amount;
                  if (moveBackAtStart(event, previousTarget)) return;
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (charge.name.trim()) focusAtStart(rowRefs.current[index]?.amount);
                    else focusAtStart(printButtonRef.current);
                  }
                }}
              />
              <input
                ref={(element) => setCellRef(index, "amount", element)}
                type="text"
                inputMode="decimal"
                value={charge.amount}
                aria-label={`Charge amount ${index + 1}`}
                onChange={(event) => {
                  if (/^-?\d*\.?\d*$/.test(event.target.value)) {
                    onUpdate(charge.key, "amount", event.target.value);
                  }
                }}
                onKeyDown={(event) => {
                  if (clearOnEscape(event, () => onUpdate(charge.key, "amount", ""))) return;
                  if (moveBackAtStart(event, rowRefs.current[index]?.name)) return;
                  if (
                    event.key === "Enter"
                    || (event.key === "Tab" && !event.shiftKey && index === charges.length - 1)
                  ) {
                    event.preventDefault();
                    finishRow(charge, index);
                  }
                }}
              />
              <button type="button" className="delete-button" onClick={() => onRemove(charge.key)} aria-label={`Delete charge row ${index + 1}`}>
                <Trash2 size={17} />
              </button>
            </div>
        ))}
      </div>
      <div className="bill-grid total-row">
        <strong>Charges total</strong><strong>{formatCurrency(total)}</strong><span />
      </div>
    </section>
  );
}
