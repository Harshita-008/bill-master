import { formatAmount } from "../../utils/formatters";

// one bold total line: Total, Brought forward or Carried forward
export default function TotalRow({ label, amount }) {
  return (
    <tr className="total-line">
      <td colSpan="4" className="invoice-total-label">{label}</td>
      <td className="invoice-total-value">{formatAmount(amount)}</td>
    </tr>
  );
}
