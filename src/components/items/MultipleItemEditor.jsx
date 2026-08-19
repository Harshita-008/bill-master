import { Save, X } from "lucide-react";
import { useRef } from "react";

export default function MultipleItemEditor({
  items,
  drafts,
  changedCount,
  saving,
  onChange,
  onSave,
  onCancel,
}) {
  const inputRefs = useRef([]);
  const saveButtonRef = useRef(null);

  const focusInput = (index) => {
    const input = inputRefs.current[index];
    if (!input) return;
    input.focus();
    input.setSelectionRange(0, 0);
  };

  const handleKeyDown = (event, inputIndex, itemId, field) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onChange(itemId, field, "");
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const nextIndex = event.shiftKey ? inputIndex - 1 : inputIndex + 1;
      if (nextIndex >= 0 && nextIndex < items.length * 3) focusInput(nextIndex);
      else if (!event.shiftKey) saveButtonRef.current?.focus();
      return;
    }
    if (
      event.key === "Backspace"
      && !event.currentTarget.value
      && event.currentTarget.selectionStart === 0
      && event.currentTarget.selectionEnd === 0
      && inputIndex > 0
    ) {
      event.preventDefault();
      focusInput(inputIndex - 1);
    }
  };

  return (
    <>
      <div className="multiple-edit-toolbar">
        <div>
          <strong>Multiple item edit</strong>
          <span>{changedCount ? `${changedCount} item${changedCount === 1 ? "" : "s"} changed` : "Edit names, rates, and units below"}</span>
        </div>
        <button type="button" className="secondary-button" onClick={onCancel} disabled={saving}>
          <X size={17} /> Cancel
        </button>
        <button
          ref={saveButtonRef}
          type="button"
          className="primary-button"
          onClick={onSave}
          disabled={!changedCount || saving}
        >
          <Save size={17} /> {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
      <div className="item-list">
        <div className="item-list-head item-master-list-head">
          <span>{items.length} items</span>
          <span>Item name</span>
          <span>Rate</span><span>Per</span><span />
        </div>
        {items.map((item, rowIndex) => {
        const draft = drafts[item.id] || item;
        return (
          <div className="item-list-row indexed-item-row item-master-row multiple-edit-row" key={item.id}>
            <div className="selection-index-cell">
              <span className="item-avatar item-index">{rowIndex + 1}</span>
            </div>
            {[
              { field: "name", value: draft.name, inputMode: undefined },
              { field: "rate", value: draft.rate, inputMode: "decimal" },
              { field: "per", value: draft.per, inputMode: undefined },
            ].map((cell, columnIndex) => {
              const inputIndex = rowIndex * 3 + columnIndex;
              return (
                <input
                  key={cell.field}
                  ref={(element) => { inputRefs.current[inputIndex] = element; }}
                  className={`multiple-edit-input multiple-edit-${cell.field}`}
                  aria-label={`Item ${rowIndex + 1} ${cell.field}`}
                  value={cell.value ?? ""}
                  inputMode={cell.inputMode}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (cell.field !== "rate" || /^\d*\.?\d*$/.test(value)) {
                      onChange(item.id, cell.field, value);
                    }
                  }}
                  onKeyDown={(event) => handleKeyDown(event, inputIndex, item.id, cell.field)}
                />
              );
            })}
            <span className="multiple-edit-status">Editing</span>
          </div>
        );
        })}
      </div>
    </>
  );
}
