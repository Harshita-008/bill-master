import { BookOpen, CornerDownLeft, ListFilter, PackageSearch } from "lucide-react";

export default function SuggestionPanel({
  kind,
  query,
  options,
  activeIndex,
  setOptionRef,
  onSelect,
  error,
  emptyMessage,
}) {
  const isLedger = kind === "ledger";
  const Icon = isLedger ? BookOpen : PackageSearch;
  const title = isLedger ? "List of Ledgers" : "List of Items";
  const countLabel = `${options.length} ${options.length === 1 ? "match" : "matches"}`;

  return (
    <section className="suggestion-panel" aria-label={title}>
      <div className="suggestion-panel-heading">
        <span className="suggestion-panel-icon"><Icon size={20} /></span>
        <div>
          <span>{title}</span>
          <strong>{query}</strong>
        </div>
        <span className="suggestion-count">{countLabel}</span>
      </div>

      <div className="suggestion-list" role="listbox">
        {options.map((option, index) => (
          <button
            type="button"
            role="option"
            aria-label={option.name}
            aria-selected={index === activeIndex}
            className={index === activeIndex ? "active" : ""}
            key={option.id}
            ref={(element) => setOptionRef(index, element)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(option)}
          >
            <span className="suggestion-option-index">{String(index + 1).padStart(2, "0")}</span>
            <span>{option.name}</span>
          </button>
        ))}
        {!options.length && emptyMessage && (
          <div className="suggestion-empty">
            <ListFilter size={22} />
            <span>{emptyMessage}</span>
          </div>
        )}
        {error && <p className="autocomplete-error">{error}</p>}
      </div>

      <div className="suggestion-panel-footer">
        <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
        <span><CornerDownLeft size={14} /> Select</span>
      </div>
    </section>
  );
}
