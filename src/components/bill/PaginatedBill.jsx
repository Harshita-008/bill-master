import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BillDocument from "./BillDocument";
import {
  BILL_PAGE_LAYOUT,
  createBillRows,
  paginateBillRows,
} from "../../utils/billPagination";

const PAGE_GAP = 24;

export default function PaginatedBill({
  bill,
  pageSize = "A6",
  scale = 1,
  onPageCountChange,
}) {
  const measurementRef = useRef(null);
  const allRows = useMemo(() => createBillRows(bill || {}), [bill]);
  const [pages, setPages] = useState(() => [allRows]);
  const pagePixels = BILL_PAGE_LAYOUT[pageSize];

  const measurePages = useCallback(() => {
    const documentElement = measurementRef.current;
    if (!documentElement) return;
    const rowElements = [...documentElement.querySelectorAll("[data-bill-row]")];
    if (allRows.length && rowElements.length !== allRows.length) return;

    const headerHeight = (documentElement.querySelector(".simple-document-header")?.offsetHeight || 0)
      + pagePixels.headerGap;
    const tableHeaderHeight = documentElement.querySelector("thead")?.offsetHeight || 0;
    const footerHeight = documentElement.querySelector("tfoot")?.offsetHeight || 0;
    const contentHeight = pagePixels.height - (pagePixels.padding * 2);
    const rowHeights = new Map(rowElements.map((element) => [
      element.dataset.rowKey,
      element.offsetHeight,
    ]));
    const nextPages = paginateBillRows({
      rows: allRows,
      rowHeights,
      firstPageCapacity: Math.max(1, contentHeight - headerHeight - tableHeaderHeight),
      continuationPageCapacity: Math.max(1, contentHeight - tableHeaderHeight),
      footerHeight,
    });
    const currentSignature = pages.map((page) => page.map((row) => row.key).join("|")).join("::");
    const nextSignature = nextPages.map((page) => page.map((row) => row.key).join("|")).join("::");
    if (currentSignature !== nextSignature) setPages(nextPages);
  }, [allRows, pagePixels, pages]);

  useEffect(() => {
    const frame = requestAnimationFrame(measurePages);
    const observer = new ResizeObserver(measurePages);
    if (measurementRef.current) observer.observe(measurementRef.current);
    document.fonts?.ready.then(measurePages);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [measurePages]);

  useEffect(() => {
    onPageCountChange?.(pages.length);
  }, [onPageCountChange, pages.length]);

  return (
    <>
      <div
        className="preview-paper-frame bill-preview-frame"
        style={{
          width: pagePixels.width * scale,
          height: ((pagePixels.height * pages.length) + (PAGE_GAP * Math.max(0, pages.length - 1))) * scale,
        }}
      >
        <div className="bill-preview-stack" style={{ "--preview-scale": scale }}>
          {pages.map((pageRows, index) => (
            <BillDocument
              key={`${pageSize}-${index}`}
              bill={bill}
              pageSize={pageSize}
              rows={pageRows}
              showHeader={index === 0}
              showFooter={index === pages.length - 1}
              pageNumber={index + 1}
              pageCount={pages.length}
            />
          ))}
        </div>
      </div>
      <div className="bill-pagination-measurer no-print" aria-hidden="true">
        <BillDocument
          bill={bill}
          pageSize={pageSize}
          documentRef={measurementRef}
          rows={allRows}
        />
      </div>
    </>
  );
}
