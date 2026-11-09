import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen } from "lucide-react";
import { api } from "../../services/api";
import { moveBackAtStart } from "../../utils/focus";
import LedgerDialog from "./LedgerDialog";
import SuggestionPanel from "./SuggestionPanel";

export default function LedgerAutocomplete({
  value,
  onChange,
  inputRef,
  onEnter = () => {},
  suggestionHost,
  inputId = "ledgerName",
  inputLabel = "Ledger name",
  autoFocus = true,
  className = "",
}) {
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const optionRefs = useRef([]);
  const suppressNextSearch = useRef(false);
  const blurTimer = useRef(null);
  // only show the list while the user is in this field
  const focused = useRef(false);

  useEffect(() => () => clearTimeout(blurTimer.current), []);

  useEffect(() => {
    if (suppressNextSearch.current) {
      suppressNextSearch.current = false;
      return undefined;
    }
    if (!value.trim()) return undefined;
    let active = true;
    const timer = setTimeout(async () => {
      const results = await api.getLedgers(value);
      if (active) {
        setOptions(results);
        setActiveIndex(null);
        setOpen(focused.current);
      }
    }, 100);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [value]);

  useEffect(() => {
    if (activeIndex === null) return;
    optionRefs.current[activeIndex]?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex]);

  const select = (ledger) => {
    suppressNextSearch.current = true;
    setSelectedLedger(ledger);
    setError("");
    onChange(ledger.name);
    setOpen(false);
    setTimeout(onEnter, 0);
  };

  const commitEdit = async () => {
    const normalized = value.trim().replace(/\s+/g, " ");
    if (selectedLedger && normalized && normalized !== selectedLedger.name) {
      try {
        const result = await api.updateLedger(selectedLedger.id, normalized);
        suppressNextSearch.current = true;
        setSelectedLedger(result.ledger);
        onChange(result.ledger.name);
        setError("");
      } catch (updateError) {
        setError(updateError.message || "Could not update the ledger name.");
        return;
      }
    }
    setOpen(false);
    onEnter();
  };

  const handleKeyDown = async (event) => {
    if (moveBackAtStart(event, null)) return;
    if (event.key === "Enter" && event.ctrlKey && selectedLedger) {
      event.preventDefault();
      setOpen(false);
      setEditOpen(true);
    } else if (event.key === "ArrowDown" && open && options.length) {
      event.preventDefault();
      setActiveIndex((index) => (index === null ? 0 : Math.min(index + 1, options.length - 1)));
    } else if (event.key === "ArrowUp" && open && options.length) {
      event.preventDefault();
      setActiveIndex((index) => (index === null ? 0 : Math.max(index - 1, 0)));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (open && activeIndex !== null && options[activeIndex]) select(options[activeIndex]);
      else await commitEdit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      suppressNextSearch.current = true;
      setSelectedLedger(null);
      setActiveIndex(null);
      setOpen(false);
      onChange("");
    }
  };

  const suggestions = open && Boolean(value.trim()) && Boolean(options.length) ? (
    <SuggestionPanel
      kind="ledger"
      query={value}
      options={options}
      activeIndex={activeIndex}
      setOptionRef={(index, element) => { optionRefs.current[index] = element; }}
      onSelect={select}
      error={error}
    />
  ) : null;

  return (
    <div className={`autocomplete ledger-autocomplete ${className}`.trim()}>
      <BookOpen className="input-icon" size={18} />
      <input
        id={inputId}
        data-name-context="ledger"
        ref={inputRef}
        autoFocus={autoFocus}
        value={value}
        onFocus={() => {
          focused.current = true;
          if (value.trim() && options.length) setOpen(true);
        }}
        onBlur={() => {
          focused.current = false;
          blurTimer.current = setTimeout(() => setOpen(false), 120);
        }}
        onChange={(event) => {
          focused.current = true;
          onChange(event.target.value);
          setError("");
          setActiveIndex(null);
          setOpen(Boolean(event.target.value.trim()));
        }}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-label={inputLabel}
        aria-expanded={open && Boolean(value.trim()) && Boolean(options.length)}
        aria-autocomplete="list"
      />
      {suggestionHost && suggestions ? createPortal(suggestions, suggestionHost) : suggestions}
      {!open && error && <p className="autocomplete-inline-error">{error}</p>}
      {editOpen && selectedLedger && (
        <LedgerDialog
          open
          type="ledger"
          mode="edit"
          entityId={selectedLedger.id}
          initialName={value}
          onClose={() => {
            setEditOpen(false);
            setTimeout(() => inputRef?.current?.focus(), 0);
          }}
          onSaved={(name, ledger) => {
            suppressNextSearch.current = true;
            setSelectedLedger(ledger || { ...selectedLedger, name });
            onChange(name);
            setEditOpen(false);
            setTimeout(() => inputRef?.current?.focus(), 0);
          }}
        />
      )}
    </div>
  );
}
