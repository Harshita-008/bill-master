import { forwardRef, useEffect, useRef, useState } from "react";
import { CalendarDays, Package, UserRound } from "lucide-react";
import LedgerAutocomplete from "../bill/LedgerAutocomplete";
import { createEmptyChallan, prepareChallan } from "../../utils/challan";
import { clearOnEscape, moveBackAtStart } from "../../utils/focus";

const DateCell = forwardRef(function DateCell(
  { label, value, maxLength, max, onChange, onEnter, previousTarget },
  ref,
) {
  return (
    <label>
      <span>{label}</span>
      <input
        ref={ref}
        value={value}
        inputMode="numeric"
        maxLength={maxLength}
        onChange={(event) => {
          const next = event.target.value.replace(/\D/g, "").slice(0, maxLength);
          if (!next || Number(next) <= max) onChange(next);
        }}
        onKeyDown={(event) => {
          if (value && clearOnEscape(event, () => onChange(""))) return;
          const previous = typeof previousTarget === "function" ? previousTarget() : previousTarget;
          if (moveBackAtStart(event, previous)) return;
          if (event.key === "Enter") {
            event.preventDefault();
            onEnter();
          }
        }}
        aria-label={`Challan date ${label.toLowerCase()}`}
      />
    </label>
  );
});

export default function ChallanForm({ initialChallan, onChange, printButtonRef, suggestionHost, children }) {
  const [draft, setDraft] = useState(initialChallan || createEmptyChallan());
  const firstToInputRef = useRef(null);
  const toRefs = useRef([]);
  const dateRefs = useRef([]);
  const boxCountRef = useRef(null);
  const deliveredByRef = useRef(null);

  useEffect(() => {
    onChange(prepareChallan(draft), draft);
  }, [draft, onChange]);

  const update = (field, value) => setDraft((current) => ({ ...current, [field]: value }));

  return (
    <div className="challan-editor-card editor-card">
      <div className="challan-form-top">
        <section className="challan-to-fields">
          <div className="challan-field-title"><UserRound size={18} /><strong>To</strong></div>
          <LedgerAutocomplete
            value={draft.toLine1}
            onChange={(value) => update("toLine1", value)}
            inputRef={firstToInputRef}
            onEnter={() => toRefs.current[1]?.focus()}
            suggestionHost={suggestionHost}
            inputId="challanLedgerName"
            inputLabel="To line 1"
            autoFocus={!initialChallan?.id}
            className="challan-ledger-autocomplete"
          />
          {["toLine2", "toLine3"].map((field, offset) => {
            const index = offset + 1;
            return (
            <input
              key={field}
              ref={(element) => { toRefs.current[index] = element; }}
              value={draft[field]}
              onChange={(event) => update(field, event.target.value)}
              onKeyDown={(event) => {
                if (draft[field] && clearOnEscape(event, () => update(field, ""))) return;
                const previous = index === 1 ? firstToInputRef.current : toRefs.current[index - 1];
                if (moveBackAtStart(event, previous)) return;
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (index < 2) toRefs.current[index + 1]?.focus();
                  else boxCountRef.current?.focus();
                }
              }}
              aria-label={`To line ${index + 1}`}
            />
            );
          })}
        </section>
        <section className="challan-date-fields">
          <div className="challan-field-title"><CalendarDays size={18} /><strong>Date</strong></div>
          <div className="challan-date-grid">
            <DateCell
              ref={(element) => { dateRefs.current[0] = element; }}
              label="Day"
              value={draft.dateDay}
              maxLength={2}
              max={31}
              onChange={(value) => update("dateDay", value)}
              onEnter={() => dateRefs.current[1]?.focus()}
              previousTarget={() => toRefs.current[2]}
            />
            <DateCell
              ref={(element) => { dateRefs.current[1] = element; }}
              label="Month"
              value={draft.dateMonth}
              maxLength={2}
              max={12}
              onChange={(value) => update("dateMonth", value)}
              onEnter={() => dateRefs.current[2]?.focus()}
              previousTarget={() => dateRefs.current[0]}
            />
            <DateCell
              ref={(element) => { dateRefs.current[2] = element; }}
              label="Year"
              value={draft.dateYear}
              maxLength={4}
              max={9999}
              onChange={(value) => update("dateYear", value)}
              onEnter={() => boxCountRef.current?.focus()}
              previousTarget={() => dateRefs.current[1]}
            />
          </div>
        </section>
      </div>

      <section className="challan-statement-field">
        <Package size={20} />
        <input
          ref={boxCountRef}
          value={draft.boxCount}
          onChange={(event) => update("boxCount", event.target.value)}
          onKeyDown={(event) => {
            if (draft.boxCount && clearOnEscape(event, () => update("boxCount", ""))) return;
            if (moveBackAtStart(event, toRefs.current[2])) return;
            if (event.key === "Enter") {
              event.preventDefault();
              deliveredByRef.current?.focus();
            }
          }}
          aria-label="Number of boxes"
        />
        <strong>box stationary goods</strong>
      </section>

      <section className="challan-by-field">
        <strong>By,</strong>
        <input
          ref={deliveredByRef}
          value={draft.deliveredBy}
          onChange={(event) => update("deliveredBy", event.target.value)}
          onKeyDown={(event) => {
            if (draft.deliveredBy && clearOnEscape(event, () => update("deliveredBy", ""))) return;
            if (moveBackAtStart(event, boxCountRef.current)) return;
            if (event.key === "Enter") {
              event.preventDefault();
              printButtonRef?.current?.focus();
            }
          }}
          aria-label="Delivered by"
        />
      </section>
      {children}
    </div>
  );
}
