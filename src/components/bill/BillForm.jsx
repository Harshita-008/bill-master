import { useEffect, useRef, useState } from "react";
import useBillForm from "../../hooks/useBillForm";
import ItemsSection from "./ItemsSection";
import ChargesSection from "./ChargesSection";
import LedgerAutocomplete from "./LedgerAutocomplete";
import LedgerDialog from "./LedgerDialog";
import PreviousAmountField from "./PreviousAmountField";
import { formatCurrency } from "../../utils/formatters";
import { focusAtStart, prepareOverwriteOnType } from "../../utils/focus";

export default function BillForm({
  initialBill,
  onBillChange,
  onDraftChange = () => {},
  printButtonRef: providedPrintButtonRef,
  lastChargeInputRef: providedLastChargeInputRef,
  suggestionHost,
  children,
}) {
  const form = useBillForm(initialBill);
  const [dialogContext, setDialogContext] = useState(null);
  const ledgerInputRef = useRef(null);
  const firstItemInputRef = useRef(null);
  const lastItemInputRef = useRef(null);
  const firstChargeInputRef = useRef(null);
  const lastChargeInputRef = useRef(null);
  const fallbackPrintButtonRef = useRef(null);
  const fallbackPreviousAmountInputRef = useRef(null);
  const printButtonRef = providedPrintButtonRef || fallbackPrintButtonRef;
  const previousAmountInputRef = providedLastChargeInputRef || fallbackPreviousAmountInputRef;

  useEffect(() => {
    onBillChange(form.preparedBill);
    onDraftChange(form.bill);
  }, [form.bill, form.preparedBill, onBillChange, onDraftChange]);

  useEffect(() => {
    const openMasterDialog = (event) => {
      if (event.altKey && event.key.toLocaleLowerCase() === "c") {
        const input = document.activeElement;
        const type = input?.dataset?.nameContext;
        if (type !== "ledger" && type !== "item") return;
        event.preventDefault();
        if (type === "item") form.updateItem(input.dataset.itemKey, "itemName", "");
        else form.setCompanyName("");
        setDialogContext({
          type,
          itemKey: input.dataset.itemKey,
          initialName: "",
          input,
        });
      }
    };
    window.addEventListener("keydown", openMasterDialog);
    return () => window.removeEventListener("keydown", openMasterDialog);
  }, [form]);

  const closeMasterDialog = () => {
    const returnInput = dialogContext?.input;
    setDialogContext(null);
    setTimeout(() => focusAtStart(returnInput), 0);
  };

  return (
    <>
      <div className="editor-card" onKeyDownCapture={prepareOverwriteOnType}>
        <section className="company-field">
          <label htmlFor="ledgerName">Ledger name</label>
          <LedgerAutocomplete
            inputRef={ledgerInputRef}
            value={form.bill.companyName}
            onChange={form.setCompanyName}
            onEnter={() => focusAtStart(firstItemInputRef.current)}
            suggestionHost={suggestionHost}
          />
        </section>
        <div className="voucher-body">
          <ItemsSection
            items={form.bill.items}
            total={form.preparedBill.itemsTotal}
            onUpdate={form.updateItem}
            onAdd={form.addItem}
            onRemove={form.removeItem}
            previousInputRef={ledgerInputRef}
            firstInputRef={firstItemInputRef}
            firstChargeInputRef={firstChargeInputRef}
            lastInputRef={lastItemInputRef}
            suggestionHost={suggestionHost}
          />
          <ChargesSection
            charges={form.bill.charges}
            total={form.preparedBill.chargesTotal}
            onUpdate={form.updateCharge}
            onAdd={form.addCharge}
            onRemove={form.removeCharge}
            firstInputRef={firstChargeInputRef}
            previousInputRef={lastItemInputRef}
            lastInputRef={lastChargeInputRef}
            printButtonRef={previousAmountInputRef}
          />
          <PreviousAmountField
            value={form.bill.previousAmount}
            onChange={form.setPreviousAmount}
            inputRef={previousAmountInputRef}
            previousInputRef={lastChargeInputRef}
            printButtonRef={printButtonRef}
          />
        </div>
        <div className="grand-total">
          <div><span>Amount payable</span><small>Positive amounts add · Negative amounts subtract</small></div>
          <strong>{formatCurrency(form.preparedBill.grandTotal)}</strong>
        </div>
        {children}
      </div>
      {dialogContext && (
        <LedgerDialog
          open
          type={dialogContext.type}
          initialName={dialogContext.initialName}
          onClose={closeMasterDialog}
          onSaved={() => {
            closeMasterDialog();
          }}
        />
      )}
    </>
  );
}
