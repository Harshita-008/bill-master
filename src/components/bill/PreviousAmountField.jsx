import { clearOnEscape, moveBackAtStart } from "../../utils/focus";

export default function PreviousAmountField({
  value,
  onChange,
  inputRef,
  previousInputRef,
  printButtonRef,
}) {
  return (
    <section className="previous-amount-section" aria-label="Previous amount adjustment">
      <div className="bill-grid previous-amount-row">
        <label htmlFor="previousAmount">
          <strong>Previous amount</strong>
        </label>
        <input
          id="previousAmount"
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={value}
          aria-label="Previous amount"
          onChange={(event) => {
            if (/^-?\d*\.?\d*$/.test(event.target.value)) onChange(event.target.value);
          }}
          onKeyDown={(event) => {
            if (clearOnEscape(event, () => onChange(""))) return;
            if (moveBackAtStart(event, previousInputRef.current)) return;
            if (event.key === "Enter") {
              event.preventDefault();
              printButtonRef.current?.focus();
            }
          }}
        />
      </div>
    </section>
  );
}
