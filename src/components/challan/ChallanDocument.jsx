export default function ChallanDocument({ challan, pageSize = "A6", previewScale = 1 }) {
  const toLines = [challan.toLine1, challan.toLine2, challan.toLine3];
  const longestLine = Math.max(0, ...toLines.map((line) => String(line || "").length));
  const lineSize = longestLine > 48 ? 0.72 : longestLine > 36 ? 0.8 : longestLine > 26 ? 0.9 : 1;
  return (
    <article
      className={`bill-document challan-document page-${pageSize.toLowerCase()}`}
      style={{
        "--preview-scale": previewScale,
        "--challan-line-size": `${lineSize}em`,
      }}
    >
      <header className="challan-document-header">
        <div className="challan-document-recipient">
          <strong>To,</strong>
          <div className="challan-document-to">
            {toLines.map((line, index) => <div key={index}>{line || "\u00A0"}</div>)}
          </div>
        </div>
        <time>{challan.challanDate || ""}</time>
      </header>
      <p className="challan-document-statement">
        <span>{challan.boxCount || "\u00A0"}</span> BOX STATIONARY GOODS
      </p>
      <p className="challan-document-by"><strong>By,</strong> <span>{challan.deliveredBy || "\u00A0"}</span></p>
    </article>
  );
}
