import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import { api } from "../../services/api";
import { moveBackAtStart } from "../../utils/focus";
import LedgerDialog from "./LedgerDialog";
import SuggestionPanel from "./SuggestionPanel";

export default function ItemAutocomplete({
  value,
  onChange,
  inputRef,
  previousInput,
  onEnter = () => {},
  onEmptyEnter = () => {},
  ariaLabel,
  itemKey,
  suggestionHost,
  onItemSelect = () => {},
}) {
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const blurTimer = useRef(null);
  const optionRefs = useRef([]);
  const suppressNextSearch = useRef(false);
  const fieldRef = useRef(null);

  useEffect(() => () => clearTimeout(blurTimer.current), []);

  const setInputRef = (element) => {
    fieldRef.current = element;
    if (typeof inputRef === "function") inputRef(element);
  };

  useEffect(() => {
    if (suppressNextSearch.current) {
      suppressNextSearch.current = false;
      return undefined;
    }
    if (!value.trim()) return undefined;
    let active = true;
    const timer = setTimeout(async () => {
      const results = await api.getItems(value);
      if (active) {
        setOptions(results);
        setActiveIndex(null);
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

  const select = (option) => {
    suppressNextSearch.current = true;
    setSelectedItem(option);
    setError("");
    onChange(option.name);
    onItemSelect(option);
    setOpen(false);
    setTimeout(onEnter, 0);
  };

  const commitEdit = async () => {
    const normalized = value.trim().replace(/\s+/g, " ");
    if (selectedItem && normalized && normalized !== selectedItem.name) {
      try {
        const result = await api.updateItem(selectedItem.id, {
          name: normalized,
          rate: selectedItem.rate,
          per: selectedItem.per,
        });
        suppressNextSearch.current = true;
        setSelectedItem(result.item);
        onChange(result.item.name);
        setError("");
      } catch (updateError) {
        setError(updateError.message || "Could not update the item name.");
        return;
      }
    }
    setOpen(false);
    onEnter();
  };

  const handleKeyDown = async (event) => {
    const previousTarget = typeof previousInput === "function" ? previousInput() : previousInput;
    if (moveBackAtStart(event, previousTarget)) return;
    if (event.key === "Enter" && event.ctrlKey && selectedItem) {
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
      if (!value.trim()) onEmptyEnter();
      else if (open && activeIndex !== null && options[activeIndex]) select(options[activeIndex]);
      else await commitEdit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      suppressNextSearch.current = true;
      setSelectedItem(null);
      setActiveIndex(null);
      setOpen(false);
      onChange("");
    }
  };

  const suggestions = open && Boolean(value.trim()) ? (
    <SuggestionPanel
      kind="item"
      query={value}
      options={options}
      activeIndex={activeIndex}
      setOptionRef={(index, element) => { optionRefs.current[index] = element; }}
      onSelect={select}
      error={error}
      emptyMessage="No saved items match this search"
    />
  ) : null;

  return (
    <div className="autocomplete">
      <Search className="input-icon" size={17} />
      <input
        ref={setInputRef}
        data-name-context="item"
        data-item-key={itemKey}
        value={value}
        aria-label={ariaLabel}
        onFocus={() => {
          if (value.trim()) setOpen(true);
        }}
        onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 120); }}
        onChange={(event) => {
          onChange(event.target.value);
          setError("");
          setActiveIndex(null);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />
      {suggestionHost && suggestions ? createPortal(suggestions, suggestionHost) : suggestions}
      {!open && error && <p className="autocomplete-inline-error">{error}</p>}
      {editOpen && selectedItem && (
        <LedgerDialog
          open
          type="item"
          mode="edit"
          entityId={selectedItem.id}
        initialName={value}
          initialRate={selectedItem.rate}
          initialPer={selectedItem.per}
          onClose={() => {
            setEditOpen(false);
            setTimeout(() => fieldRef.current?.focus(), 0);
          }}
          onSaved={(name, item) => {
            suppressNextSearch.current = true;
            setSelectedItem(item || { ...selectedItem, name });
            onChange(name);
            if (item) onItemSelect(item);
            setEditOpen(false);
            setTimeout(() => fieldRef.current?.focus(), 0);
          }}
        />
      )}
    </div>
  );
}
