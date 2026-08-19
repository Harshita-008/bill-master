import { useEffect, useMemo, useState } from "react";
import { BookUser, Pencil, Plus, Search, Trash2 } from "lucide-react";
import LedgerDialog from "../components/bill/LedgerDialog";
import BulkDeleteDialog from "../components/ui/BulkDeleteDialog";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import SelectionToolbar from "../components/ui/SelectionToolbar";
import useSelection from "../hooks/useSelection";
import { api } from "../services/api";

export default function LedgerMasterPage() {
  const [ledgers, setLedgers] = useState([]);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [editingLedger, setEditingLedger] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);

  const loadLedgers = () => api.getLedgers("").then(setLedgers);
  useEffect(() => { loadLedgers(); }, []);
  useEffect(() => {
    if (!pendingDelete) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setPendingDelete(null);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [pendingDelete]);

  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return ledgers.filter((ledger) => ledger.name.toLocaleLowerCase().includes(search));
  }, [ledgers, query]);
  const visibleIds = useMemo(() => filtered.map((ledger) => ledger.id), [filtered]);
  const selection = useSelection(visibleIds);

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;

    try {
      const result = await api.addLedger(name);
      setMessage(result.added ? `"${result.ledger.name}" was added.` : `"${result.ledger.name}" is already saved.`);
      setName("");
      await loadLedgers();
    } catch (error) {
      setMessage(error.message || "The ledger could not be added.");
    }
  };

  const remove = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      const result = await api.deleteLedger(pendingDelete.id);
      if (!result.deleted) throw new Error("Ledger was not found.");
      setLedgers((current) => current.filter((entry) => entry.id !== pendingDelete.id));
      setMessage(`"${pendingDelete.name}" was deleted. Its saved bills are still available.`);
      setPendingDelete(null);
      selection.clear();
    } catch (error) {
      setMessage(error.message || "The ledger could not be deleted.");
    } finally {
      setDeleting(false);
    }
  };

  const removeSelected = async () => {
    if (!selection.selectedIds.size || bulkDeleting) return;
    setBulkDeleting(true);
    const ids = [...selection.selectedIds];
    try {
      const result = await api.deleteLedgers(ids);
      const selected = new Set(ids);
      setLedgers((current) => current.filter((ledger) => !selected.has(ledger.id)));
      setMessage(`${result.deleted} selected ledger${result.deleted === 1 ? "" : "s"} deleted. Saved bills remain available.`);
      selection.clear();
      setBulkDeleteOpen(false);
      setSelectionMode(false);
    } catch (error) {
      setMessage(error.message || "The selected ledgers could not be deleted.");
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Ledger master"
        title="Your ledgers"
        description="Add and manage the ledger names suggested while creating bills. Deleting a ledger here never deletes its saved bills."
      />

      <div className="ledger-add-panel">
        <form className="manual-add" onSubmit={handleAdd}>
          <label htmlFor="newLedger">Add a ledger</label>
          <div>
            <input
              id="newLedger"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter ledger name"
              autoFocus
            />
            <button className="primary-button" type="submit"><Plus size={18} /> Add ledger</button>
          </div>
        </form>
      </div>

      {message && (
        <div className="info-banner">
          {message}
          <button onClick={() => setMessage("")} aria-label="Dismiss message">×</button>
        </div>
      )}

      {!!ledgers.length && (
        <>
          <div className="search-box">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search saved ledgers"
            />
          </div>
          <SelectionToolbar
            active={selectionMode}
            entityName="ledger"
            selectedCount={selection.selectedIds.size}
            visibleCount={visibleIds.length}
            allVisibleSelected={selection.allVisibleSelected}
            onToggleAll={selection.toggleAllVisible}
            onDelete={() => setBulkDeleteOpen(true)}
            onStart={() => setSelectionMode(true)}
            onClose={() => {
              selection.clear();
              setSelectionMode(false);
            }}
          />
        </>
      )}

      {!ledgers.length ? (
        <EmptyState
          icon={BookUser}
          title="No ledgers saved yet"
          description="Add your first ledger here, or press Alt+C while creating a bill."
        />
      ) : (
        <div className="item-list">
          <div className="item-list-head">
            <span>{filtered.length} saved ledger{filtered.length === 1 ? "" : "s"}</span>
            <span>Ledger name</span>
          </div>
          {filtered.map((ledger) => (
            <div className={`item-list-row ${selectionMode ? "ledger-master-row" : ""}`} key={ledger.id}>
              {selectionMode && (
                <input
                  type="checkbox"
                  checked={selection.selectedIds.has(ledger.id)}
                  onChange={() => selection.toggle(ledger.id)}
                  aria-label={`Select ${ledger.name}`}
                />
              )}
              <span className="item-avatar">{ledger.name.charAt(0).toUpperCase()}</span>
              <strong>{ledger.name}</strong>
              <div className="master-row-actions">
                <button
                  type="button"
                  className="edit-button"
                  onClick={() => setEditingLedger(ledger)}
                  aria-label={`Edit ${ledger.name}`}
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => setPendingDelete(ledger)}
                  aria-label={`Delete ${ledger.name}`}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
          {!filtered.length && <p className="no-results">No ledgers match “{query}”.</p>}
        </div>
      )}

      {editingLedger && (
        <LedgerDialog
          open
          type="ledger"
          mode="edit"
          entityId={editingLedger.id}
          initialName={editingLedger.name}
          onClose={() => setEditingLedger(null)}
          onSaved={(updatedName, ledger) => {
            setLedgers((current) => current.map((entry) => (
              entry.id === editingLedger.id ? (ledger || { ...entry, name: updatedName }) : entry
            )));
            setMessage(`"${updatedName}" was updated.`);
            setEditingLedger(null);
          }}
        />
      )}

      {bulkDeleteOpen && (
        <BulkDeleteDialog
          count={selection.selectedIds.size}
          entityName="ledger"
          deleting={bulkDeleting}
          onCancel={() => setBulkDeleteOpen(false)}
          onConfirm={removeSelected}
        />
      )}

      {pendingDelete && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setPendingDelete(null)}>
          <section
            className="ledger-dialog delete-ledger-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deleteLedgerTitle"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="dialog-heading">
              <span className="dialog-icon danger-icon"><Trash2 size={20} /></span>
              <div>
                <h2 id="deleteLedgerTitle">Delete {pendingDelete.name}?</h2>
                <p>This removes the name from suggestions. Its saved bills will remain available.</p>
              </div>
            </div>
            <div className="dialog-actions delete-dialog-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button type="button" className="danger-button" onClick={remove} disabled={deleting}>
                <Trash2 size={17} /> {deleting ? "Deleting…" : "Delete ledger"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
