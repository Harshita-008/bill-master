import { formatAmount, formatDateOnly } from "../../utils/formatters";
import { createBillRows } from "../../utils/billPagination";

export default function BillDocument({
  bill,
  pageSize = "A6",
  previewScale = 1,
  documentRef,
  rows = createBillRows(bill),
  showHeader = true,
  showFooter = true,
  pageNumber,
  pageCount,
  interactiveItemMarks = false,
  onToggleItemMark,
}) {
  return (
    <article
      ref={documentRef}
      className={`bill-document page-${pageSize.toLowerCase()}`}
      style={{ "--preview-scale": previewScale }}
      aria-label={pageNumber ? `Bill page ${pageNumber} of ${pageCount}` : undefined}
    >
      {showHeader && (
        <header className="simple-document-header">
          <h1>{bill.companyName}</h1>
          <time>{formatDateOnly(bill.createdAt || new Date().toISOString())}</time>
        </header>
      )}
      <table className="simple-document-table">
        <colgroup>
          <col className="qty-column" />
          <col className="per-column" />
          <col className="items-column" />
          <col className="rate-column" />
          <col className="amount-column" />
        </colgroup>
        <thead>
          <tr>
            <th>Qty</th>
            <th>Per</th>
            <th>Items</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            if (row.kind === "item") {
              const item = row.value;
              return (
                <tr
                  key={row.key}
                  data-bill-row
                  data-row-key={row.key}
                  className={interactiveItemMarks && item.isMarked ? "saved-item-marked" : ""}
                >
                  <td>{item.quantity}</td>
                  <td>{item.per}</td>
                  <td className="item-document-name-cell">
                    <div className="item-document-name-line">
                      {interactiveItemMarks && (
                        <button
                          type="button"
                          role="switch"
                          aria-checked={Boolean(item.isMarked)}
                          className="saved-item-mark-toggle no-print"
                          onClick={() => onToggleItemMark?.(item)}
                          aria-label={`Toggle red row for ${item.itemName}`}
                          title={item.isMarked ? "Return row to black" : "Mark row red"}
                        >
                          <span />
                        </button>
                      )}
                      <span>{item.itemName}</span>
                    </div>
                    {item.note && <div className="item-document-note">{item.note}</div>}
                  </td>
                  <td>{formatAmount(item.rate)}</td>
                  <td>{formatAmount(item.amount)}</td>
                </tr>
              );
            }
            if (row.kind === "charge") {
              const charge = row.value;
              return (
                <tr key={row.key} data-bill-row data-row-key={row.key}>
                  <td />
                  <td />
                  <td>{charge.name}</td>
                  <td />
                  <td>{formatAmount(charge.amount)}</td>
                </tr>
              );
            }
            return (
              <tr key={row.key} data-bill-row data-row-key={row.key} className="previous-amount-document-row">
                <td colSpan="3" />
                <td className="invoice-adjustment-label">Previous amount</td>
                <td className="invoice-adjustment-value">{formatAmount(row.value)}</td>
              </tr>
            );
          })}
        </tbody>
        {showFooter && (
          <tfoot>
            <tr>
              <td colSpan="3" />
              <td className="invoice-total-label">Total</td>
              <td className="invoice-total-value">{formatAmount(bill.grandTotal)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </article>
  );
}
