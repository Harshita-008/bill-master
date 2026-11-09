import { formatAmount, formatAmountOrBlank, formatDateOnly } from "../../utils/formatters";
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
                <tr key={row.key} data-bill-row data-row-key={row.key}>
                  <td>{item.quantity || ""}</td>
                  <td>{item.per}</td>
                  <td className="item-document-name-cell">{item.itemName}</td>
                  <td>{formatAmountOrBlank(item.rate)}</td>
                  <td>{formatAmountOrBlank(item.amount)}</td>
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
