import { useEffect, useRef, useState } from "react";
import { BookPlus, PackagePlus, X } from "lucide-react";
import { api } from "../../services/api";

export default function LedgerDialog({
  open,
  type = "ledger",
  mode = "create",
  entityId,
  initialName = "",
  initialRate = "",
  initialPer = "",
  onClose,
  onSaved,
}) {
  const [name, setName] = useState(initialName);
  const [rate, setRate] = useState(initialRate || "");
  const [per, setPer] = useState(initialPer || "");
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const rateInputRef = useRef(null);
  const perInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  if (!open) return null;

  const close = () => {
    setName("");
    setRate("");
    setPer("");
    setError("");
    onClose();
  };

  const save = async (event) => {
    event.preventDefault();
    const entityName = type === "item" ? "item" : "ledger";
    if (!name.trim()) return setError(`Enter a${type === "item" ? "n" : ""} ${entityName} name.`);
    try {
      const normalized = name.trim().replace(/\s+/g, " ");
      let result;
      if (mode === "edit") {
        result = type === "item"
          ? await api.updateItem(entityId, { name: normalized, rate, per })
          : await api.updateLedger(entityId, normalized);
      } else {
        result = type === "item"
          ? await api.addItems([{ name: normalized, rate, per }])
          : await api.addLedger(normalized);
      }
      setName("");
      setError("");
      const record = type === "item" ? result.item : result.ledger;
      onSaved(record?.name || normalized, record);
    } catch (saveError) {
      setError(saveError.message || `Could not save the ${entityName}.`);
    }
  };

  const isItem = type === "item";
  const isEditing = mode === "edit";
  const Icon = isItem ? PackagePlus : BookPlus;
  const entityName = isItem ? "item" : "ledger";

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={close}>
      <form
        className="ledger-dialog"
        onSubmit={save}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            close();
          }
        }}
      >
        <div className="dialog-heading">
          <span className="dialog-icon"><Icon size={21} /></span>
          <div>
            <h2>{isEditing ? "Alter" : "Create"} {entityName}</h2>
            <p>{isItem
              ? (isEditing ? "Update these saved details everywhere this item is suggested." : "Save details for quick use in future bills.")
              : (isEditing ? "Update this saved name everywhere it is suggested." : "Save a name for quick use in future bills.")}
            </p>
          </div>
          <button type="button" className="icon-button" onClick={close} aria-label={`Close ${entityName} dialog`}><X size={18} /></button>
        </div>
        <label htmlFor={isItem ? "newItemName" : "newLedgerName"}>{isItem ? "Item" : "Ledger"} name</label>
        <input
          ref={inputRef}
          id={isItem ? "newItemName" : "newLedgerName"}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (isItem && event.key === "Enter") {
              event.preventDefault();
              rateInputRef.current?.focus();
            }
          }}
        />
        {isItem && (
          <div className="item-detail-fields">
            <label htmlFor="newItemRate">
              <span>Rate</span>
              <input
                ref={rateInputRef}
                id="newItemRate"
                type="text"
                inputMode="decimal"
                value={rate}
                onChange={(event) => {
                  if (/^\d*\.?\d*$/.test(event.target.value)) setRate(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    perInputRef.current?.focus();
                  }
                }}
              />
            </label>
            <label htmlFor="newItemPer">
              <span>Per</span>
              <input ref={perInputRef} id="newItemPer" value={per} onChange={(event) => setPer(event.target.value)} />
            </label>
          </div>
        )}
        {error && <p className="dialog-error">{error}</p>}
        <div className="dialog-actions">
          <span>Enter to save · Esc to close</span>
          <button className="primary-button" type="submit">{isEditing ? "Save changes" : "Save"}</button>
        </div>
      </form>
    </div>
  );
}
