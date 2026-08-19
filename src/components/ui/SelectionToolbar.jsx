import { CheckCheck, ListChecks, Trash2, X } from "lucide-react";

export default function SelectionToolbar({
  selectedCount,
  visibleCount,
  allVisibleSelected,
  onToggleAll,
  onDelete,
  active,
  entityName,
  onStart,
  onClose,
}) {
  if (!active) {
    return (
      <div className="selection-mode-launch">
        <button type="button" className="selection-mode-button" onClick={onStart}>
          <ListChecks size={17} /> Select {entityName}s
        </button>
      </div>
    );
  }

  return (
    <div className="selection-toolbar">
      <button type="button" className="selection-all-button" onClick={onToggleAll} disabled={!visibleCount}>
        <CheckCheck size={17} /> {allVisibleSelected ? "Clear selection" : "Select all"}
      </button>
      <span>{selectedCount ? `${selectedCount} selected` : "Select rows to delete together"}</span>
      <button
        type="button"
        className="danger-button selection-delete-button"
        onClick={onDelete}
        disabled={!selectedCount}
      >
        <Trash2 size={16} /> Delete selected
      </button>
      <button type="button" className="selection-close-button" onClick={onClose} aria-label="Close selection mode">
        <X size={17} />
      </button>
    </div>
  );
}
