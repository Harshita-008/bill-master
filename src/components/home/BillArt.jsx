import { ClipboardPlus, PackagePlus } from "lucide-react";

// rows of the drawn bill: [left width, right width]
const LINES = [
  [58, 18],
  [46, 22],
  [64, 15],
  [40, 20],
];

// picture of a bill, only for looks
export default function BillArt() {
  return (
    <div className="bill-art" aria-hidden="true">
      <span className="bill-art-glow" />
      <span className="bill-art-back" />

      <div className="bill-art-paper">
        <div className="paper-row">
          <span className="paper-line paper-dark" style={{ width: "52%" }} />
          <span className="paper-line" style={{ width: "22%" }} />
        </div>

        <span className="paper-rule" />

        {LINES.map(([left, right], index) => (
          <div className="paper-row" key={index}>
            <span className="paper-line" style={{ width: `${left}%` }} />
            <span className="paper-line" style={{ width: `${right}%` }} />
          </div>
        ))}

        <div className="paper-row paper-total">
          <span className="paper-line paper-dark" style={{ width: "28%" }} />
          <span className="paper-line paper-accent" style={{ width: "32%" }} />
        </div>
      </div>

      <span className="bill-art-badge badge-items" style={{ "--hue": "#3d8b4f" }}>
        <span className="quick-link-icon"><PackagePlus size={16} /></span>
        Items
      </span>

      <span className="bill-art-badge badge-challan" style={{ "--hue": "#d9822b" }}>
        <span className="quick-link-icon"><ClipboardPlus size={16} /></span>
        Challan
      </span>
    </div>
  );
}
