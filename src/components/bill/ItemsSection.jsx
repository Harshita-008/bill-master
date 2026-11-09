import { useRef } from "react";
import { Trash2 } from "lucide-react";
import ItemAutocomplete from "./ItemAutocomplete";
import { formatCurrency } from "../../utils/formatters";
import { clearOnEscape, focusAtStart, moveBackAtStart } from "../../utils/focus";

export default function ItemsSection({
  items,
  total,
  onUpdate,
  onAdd,
  onRemove,
  previousInputRef,
  firstInputRef,
  firstChargeInputRef,
  lastInputRef,
  suggestionHost,
}) {
  const rowRefs = useRef([]);

  const setCellRef = (index, cell, element) => {
    if (!rowRefs.current[index]) rowRefs.current[index] = {};
    rowRefs.current[index][cell] = element;
    if (cell === "name" && index === 0) firstInputRef.current = element;
    if (index === items.length - 1) {
      const lastItemIsEmpty = !items[index]?.itemName.trim();
      if (cell === "name" && lastItemIsEmpty) lastInputRef.current = element;
      if (cell === "per" && !lastItemIsEmpty) lastInputRef.current = element;
    }
  };

  const addAndFocus = () => {
    onAdd();
    setTimeout(() => focusAtStart(rowRefs.current[items.length]?.name, { smoothScroll: true }), 0);
  };

  const finishRow = (item, index) => {
    if (!item.itemName.trim()) {
      focusAtStart(firstChargeInputRef.current);
    } else if (index < items.length - 1) {
      focusAtStart(rowRefs.current[index + 1]?.name);
    } else {
      addAndFocus();
    }
  };

  return (
    <section className="bill-section items-section" aria-label="Items">
      <div className="bill-grid grid-header">
        <span>Name of Item</span><span>Quantity</span><span>Rate</span><span>per</span><span>Amount</span><span />
      </div>
      <div className="rows">
        {items.map((item, index) => (
          <div className="item-row-group" key={item.key}>
            <div className="bill-grid bill-row">
              <ItemAutocomplete
                inputRef={(element) => setCellRef(index, "name", element)}
                value={item.itemName}
                onChange={(value) => onUpdate(item.key, "itemName", value)}
                previousInput={() => (
                  index === 0 ? previousInputRef.current : rowRefs.current[index - 1]?.per
                )}
                onEnter={() => focusAtStart(rowRefs.current[index]?.quantity)}
                onEmptyEnter={() => focusAtStart(firstChargeInputRef.current)}
                ariaLabel={`Item name ${index + 1}`}
                itemKey={item.key}
                suggestionHost={suggestionHost}
                onItemSelect={(savedItem) => {
                  onUpdate(item.key, "rate", Number(savedItem.rate) ? String(savedItem.rate) : "");
                  onUpdate(item.key, "per", savedItem.per || "");
                }}
              />
              <input
                ref={(element) => setCellRef(index, "quantity", element)}
                aria-label={`Quantity for item ${index + 1}`}
                type="text"
                inputMode="numeric"
                value={item.quantity}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === "" || /^[1-9]\d*$/.test(value)) {
                    onUpdate(item.key, "quantity", value);
                  }
                }}
                onKeyDown={(event) => {
                  if (clearOnEscape(event, () => onUpdate(item.key, "quantity", ""))) return;
                  if (moveBackAtStart(event, rowRefs.current[index]?.name)) return;
                  if (event.key === "Enter") {
                    event.preventDefault();
                    focusAtStart(rowRefs.current[index]?.rate);
                  }
                }}
              />
              <input
                ref={(element) => setCellRef(index, "rate", element)}
                aria-label={`Rate for item ${index + 1}`}
                type="text"
                inputMode="decimal"
                value={item.rate}
                onChange={(event) => {
                  if (/^\d*\.?\d*$/.test(event.target.value)) {
                    onUpdate(item.key, "rate", event.target.value);
                  }
                }}
                onKeyDown={(event) => {
                  if (clearOnEscape(event, () => onUpdate(item.key, "rate", ""))) return;
                  if (moveBackAtStart(event, rowRefs.current[index]?.quantity)) return;
                  if (event.key === "Enter") {
                    event.preventDefault();
                    focusAtStart(rowRefs.current[index]?.per);
                  }
                }}
              />
              <input
                ref={(element) => setCellRef(index, "per", element)}
                aria-label={`Per for item ${index + 1}`}
                value={item.per}
                onChange={(event) => onUpdate(item.key, "per", event.target.value)}
                onKeyDown={(event) => {
                  if (clearOnEscape(event, () => onUpdate(item.key, "per", ""))) return;
                  if (moveBackAtStart(event, rowRefs.current[index]?.rate)) return;
                  if (
                    event.key === "Enter"
                    || (event.key === "Tab" && !event.shiftKey && index === items.length - 1)
                  ) {
                    event.preventDefault();
                    finishRow(item, index);
                  }
                }}
              />
              <div className="amount-cell">{formatCurrency(item.amount)}</div>
              <div className="item-row-actions">
                <button type="button" className="delete-button" onClick={() => onRemove(item.key)} aria-label={`Delete item row ${index + 1}`}>
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="bill-grid total-row">
        <strong>Items total</strong><strong>{formatCurrency(total)}</strong><span />
      </div>
    </section>
  );
}
