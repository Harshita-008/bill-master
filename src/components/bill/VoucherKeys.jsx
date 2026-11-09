// shortcuts the bill editor already supports
const KEYS = [
  ["Enter", "Next"],
  ["Backspace", "Previous"],
  ["Alt+C", "Create master"],
  ["Ctrl+Enter", "Alter master"],
  ["Esc", "Clear / Back"],
];

export default function VoucherKeys() {
  return (
    <ul className="voucher-keys" aria-label="Keyboard shortcuts">
      {KEYS.map(([key, action]) => (
        <li key={key}><kbd>{key}</kbd>{action}</li>
      ))}
    </ul>
  );
}
