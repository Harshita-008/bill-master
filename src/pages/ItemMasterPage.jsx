import { useEffect, useMemo, useRef, useState } from "react";
import { FileSpreadsheet, ListChecks, PackageOpen, Pencil, PencilLine, Plus, Search, Trash2, Upload } from "lucide-react";
import LedgerDialog from "../components/bill/LedgerDialog";
import MultipleItemEditor from "../components/items/MultipleItemEditor";
import BulkDeleteDialog from "../components/ui/BulkDeleteDialog";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import SelectionToolbar from "../components/ui/SelectionToolbar";
import useSelection from "../hooks/useSelection";
import { api } from "../services/api";
import { extractItems } from "../utils/itemImport";
import { importMessage } from "../utils/importMessage";
import { readWorkbookRows } from "../utils/readWorkbook";

export default function ItemMasterPage() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [per, setPer] = useState("");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [multipleEditMode, setMultipleEditMode] = useState(false);
  const [multipleEditDrafts, setMultipleEditDrafts] = useState({});
  const [savingMultiple, setSavingMultiple] = useState(false);
  const fileInput = useRef(null);
  const itemNameInputRef = useRef(null);
  const itemRateInputRef = useRef(null);
  const itemPerInputRef = useRef(null);

  const loadItems = () => api.getItems("", null).then(setItems);
  useEffect(() => { loadItems(); }, []);

  const filtered = useMemo(() => items.filter((item) => (
    item.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())
  )), [items, query]);
  const visibleIds = useMemo(() => filtered.map((item) => item.id), [filtered]);
  const selection = useSelection(visibleIds);

  const changedItems = useMemo(() => items.filter((item) => {
    const draft = multipleEditDrafts[item.id];
    if (!draft) return false;
    return draft.name.trim() !== item.name
      || Number(draft.rate || 0) !== Number(item.rate || 0)
      || draft.per.trim() !== String(item.per || "").trim();
  }).map((item) => ({ id: item.id, ...multipleEditDrafts[item.id] })), [items, multipleEditDrafts]);

  const addNames = async (names) => {
    const result = await api.addItems(names);
    setMessage(
      `${result.added} unique item${result.added === 1 ? "" : "s"} added`
      + `${result.skipped ? `, ${result.skipped} duplicate or already saved` : ""}.`,
    );
    await loadItems();
  };

  const handleManualAdd = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    await addNames([{ name, rate, per }]);
    setName("");
    setRate("");
    setPer("");
    setTimeout(() => itemNameInputRef.current?.focus(), 0);
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const items = extractItems(await readWorkbookRows(file));
      const result = await api.importItems(items);
      setMessage(importMessage(result));
      await loadItems();
    } catch {
      setMessage("That sheet could not be read. Use an XLSX, XLS, or CSV file with item names.");
    }
  };

  const remove = async (id) => {
    await api.deleteItem(id);
    setItems((current) => current.filter((item) => item.id !== id));
    selection.clear();
  };

  const removeSelected = async () => {
    if (!selection.selectedIds.size || bulkDeleting) return;
    setBulkDeleting(true);
    const ids = [...selection.selectedIds];
    try {
      const result = await api.deleteItems(ids);
      const selected = new Set(ids);
      setItems((current) => current.filter((item) => !selected.has(item.id)));
      setMessage(`${result.deleted} selected item${result.deleted === 1 ? "" : "s"} deleted.`);
      selection.clear();
      setBulkDeleteOpen(false);
      setSelectionMode(false);
    } catch (error) {
      setMessage(error.message || "The selected items could not be deleted.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const startMultipleEdit = () => {
    selection.clear();
    setSelectionMode(false);
    setMultipleEditDrafts(Object.fromEntries(items.map((item) => [item.id, {
      name: item.name,
      rate: Number(item.rate) ? String(item.rate) : "",
      per: item.per || "",
    }])));
    setMultipleEditMode(true);
    setMessage("");
  };

  const updateMultipleDraft = (id, field, value) => {
    setMultipleEditDrafts((current) => ({
      ...current,
      [id]: { ...current[id], [field]: value },
    }));
  };

  const saveMultipleEdits = async () => {
    if (!changedItems.length || savingMultiple) return;
    setSavingMultiple(true);
    try {
      const result = await api.updateItems(changedItems);
      const updated = new Map(result.items.map((item) => [item.id, item]));
      setItems((current) => current.map((item) => updated.get(item.id) || item));
      setMessage(`${result.updated} item${result.updated === 1 ? "" : "s"} updated.`);
      setMultipleEditMode(false);
      setMultipleEditDrafts({});
    } catch (error) {
      setMessage(error.message || "The item changes could not be saved.");
    } finally {
      setSavingMultiple(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Item master"
        title="Your item library"
        description="Saved item names, rates, and units fill bill rows automatically and can still be changed for each bill."
      />
      <div className="item-tools">
        <form className="manual-add" onSubmit={handleManualAdd}>
          <label htmlFor="newItem">Add an item manually</label>
          <div className="manual-item-fields">
            <input
              ref={itemNameInputRef}
              id="newItem"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  itemRateInputRef.current?.focus();
                }
              }}
              placeholder="Enter item name"
            />
            <input
              ref={itemRateInputRef}
              aria-label="New item rate"
              value={rate}
              inputMode="decimal"
              onChange={(event) => {
                if (/^\d*\.?\d*$/.test(event.target.value)) setRate(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  itemPerInputRef.current?.focus();
                }
              }}
              placeholder="Rate"
            />
            <input
              ref={itemPerInputRef}
              aria-label="New item per"
              value={per}
              onChange={(event) => setPer(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Per"
            />
            <button className="primary-button add-item-submit" type="submit">
              <span className="add-item-button-icon"><Plus size={17} /></span>
              <span>Add item</span>
            </button>
          </div>
        </form>
        <div className="import-panel">
          <FileSpreadsheet size={25} />
          <div><strong>Import from Excel</strong><span>New items are added, changed rates and units are updated</span></div>
          <button className="secondary-button" onClick={() => fileInput.current?.click()}><Upload size={17} /> Choose file</button>
          <input ref={fileInput} className="visually-hidden" type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} />
        </div>
      </div>
      {message && <div className="info-banner">{message}<button onClick={() => setMessage("")}>×</button></div>}
      {!!items.length && (
        <>
          <div className="search-box">
            <Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search saved items" />
          </div>
          {selectionMode ? (
            <SelectionToolbar
              active
              entityName="item"
              selectedCount={selection.selectedIds.size}
              visibleCount={visibleIds.length}
              allVisibleSelected={selection.allVisibleSelected}
              onToggleAll={selection.toggleAllVisible}
              onDelete={() => setBulkDeleteOpen(true)}
              onClose={() => {
                selection.clear();
                setSelectionMode(false);
              }}
            />
          ) : !multipleEditMode && (
            <div className="master-mode-launch">
              <button type="button" className="selection-mode-button" onClick={startMultipleEdit}>
                <PencilLine size={17} /> Multiple edit
              </button>
              <button type="button" className="selection-mode-button" onClick={() => setSelectionMode(true)}>
                <ListChecks size={17} /> Select items
              </button>
            </div>
          )}
        </>
      )}
      {!items.length ? (
        <EmptyState icon={PackageOpen} title="No items saved yet" description="Add your first item manually or bring in a complete list from Excel." />
      ) : multipleEditMode ? (
        <MultipleItemEditor
          items={filtered}
          drafts={multipleEditDrafts}
          changedCount={changedItems.length}
          saving={savingMultiple}
          onChange={updateMultipleDraft}
          onSave={saveMultipleEdits}
          onCancel={() => {
            setMultipleEditMode(false);
            setMultipleEditDrafts({});
          }}
        />
      ) : (
        <div className="item-list">
          <div className="item-list-head item-master-list-head">
            <span>{filtered.length} items</span>
            <span>Item name</span>
            <span>Rate</span><span>Per</span><span />
          </div>
          {filtered.map((item, index) => (
            <div className="item-list-row indexed-item-row item-master-row" key={item.id}>
              <div className={`selection-index-cell ${selectionMode ? "selection-active" : ""}`}>
                {selectionMode && (
                  <input
                    type="checkbox"
                    checked={selection.selectedIds.has(item.id)}
                    onChange={() => selection.toggle(item.id)}
                    aria-label={`Select ${item.name}`}
                  />
                )}
                <span className="item-avatar item-index">{index + 1}</span>
              </div>
              <strong>{item.name}</strong>
              <span className="item-master-rate">{Number(item.rate) ? Number(item.rate).toFixed(2) : "—"}</span>
              <span className="item-master-per">{item.per || "—"}</span>
              <div className="master-row-actions">
                <button className="edit-button" onClick={() => setEditingItem(item)} aria-label={`Edit ${item.name}`}><Pencil size={16} /></button>
                <button className="delete-button" onClick={() => remove(item.id)} aria-label={`Delete ${item.name}`}><Trash2 size={17} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editingItem && (
        <LedgerDialog
          open
          type="item"
          mode="edit"
          entityId={editingItem.id}
          initialName={editingItem.name}
          initialRate={editingItem.rate}
          initialPer={editingItem.per}
          onClose={() => setEditingItem(null)}
          onSaved={(updatedName, item) => {
            setItems((current) => current.map((entry) => (
              entry.id === editingItem.id ? (item || { ...entry, name: updatedName }) : entry
            )));
            setMessage(`"${updatedName}" was updated.`);
            setEditingItem(null);
          }}
        />
      )}
      {bulkDeleteOpen && (
        <BulkDeleteDialog
          count={selection.selectedIds.size}
          entityName="item"
          deleting={bulkDeleting}
          onCancel={() => setBulkDeleteOpen(false)}
          onConfirm={removeSelected}
        />
      )}
    </div>
  );
}
