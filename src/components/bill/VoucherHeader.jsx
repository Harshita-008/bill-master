import { formatVoucherDate } from "../../utils/voucherDate";

export default function VoucherHeader({ billId, createdAt }) {
  const { date, weekday } = formatVoucherDate(createdAt);

  return (
    <div className="voucher-header">
      <div className="voucher-title">
        <span className="voucher-type">Bill</span>
        {billId && <span className="voucher-no">No.<strong>{String(billId).padStart(4, "0")}</strong></span>}
      </div>
      <div className="voucher-date">
        <strong>{date}</strong>
        <small>{weekday}</small>
      </div>
    </div>
  );
}
