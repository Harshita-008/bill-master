import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Edit3, Maximize2, Printer, RefreshCw, ZoomIn, ZoomOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BillDocument from "../components/bill/BillDocument";
import { api } from "../services/api";
import useEnterToPrint from "../hooks/useEnterToPrint";
import {
  BILL_PAGE_LAYOUT,
  createBillRows,
  paginateBillRows,
} from "../utils/billPagination";
import {
  cachePrinters,
  choosePrinter,
  PREFERRED_PRINTER_KEY,
  readCachedPrinters,
  rememberPrinter,
} from "../utils/printerCache";

export default function PrintPreviewPage() {
  const navigate = useNavigate();
  const bill = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("billmaster.printDraft"));
    } catch {
      return null;
    }
  }, []);
  const [pageSize, setPageSize] = useState("A6");
  const [copies, setCopies] = useState(1);
  const [printers, setPrinters] = useState(readCachedPrinters);
  const [deviceName, setDeviceName] = useState(() => localStorage.getItem(PREFERRED_PRINTER_KEY) || "");
  const [status, setStatus] = useState("");
  const [zoom, setZoom] = useState(100);
  const previewRef = useRef(null);
  const measurementRef = useRef(null);
  const copiesInputRef = useRef(null);
  const printingRef = useRef(false);
  const allRows = useMemo(() => createBillRows(bill || {}), [bill]);
  const [pages, setPages] = useState(() => [allRows]);
  const pagePixels = BILL_PAGE_LAYOUT[pageSize];

  const fitToView = useCallback(() => {
    const preview = previewRef.current;
    if (!preview) return;
    const widthScale = (preview.clientWidth - 64) / pagePixels.width;
    const heightScale = (preview.clientHeight - 64) / pagePixels.height;
    setZoom(Math.max(35, Math.min(140, Math.floor(Math.min(widthScale, heightScale) * 100))));
  }, [pagePixels.height, pagePixels.width]);

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

  const loadPrinters = async () => {
    const available = cachePrinters(await api.getPrinters(true));
    setPrinters(available);
    const preferred = choosePrinter(available, deviceName);
    if (preferred) {
      setDeviceName(preferred.name);
      rememberPrinter(preferred.name);
    }
  };

  useEffect(() => {
    if (readCachedPrinters().length) return undefined;
    let active = true;
    api.getPrinters().then((available) => {
      if (!active) return;
      const cached = cachePrinters(available);
      setPrinters(cached);
      const preferred = choosePrinter(cached);
      if (preferred) {
        setDeviceName(preferred.name);
        rememberPrinter(preferred.name);
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(fitToView);
    const observer = new ResizeObserver(fitToView);
    if (previewRef.current) observer.observe(previewRef.current);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [fitToView]);

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

  useEnterToPrint(handlePrint, copiesInputRef);

  if (!bill) {
    return <div className="empty-state"><h2>No bill to preview</h2><p>Return to the editor and prepare a bill first.</p><button className="primary-button" onClick={() => navigate("/bills/new")}>Create bill</button></div>;
  }

  async function handlePrint() {
    if (printingRef.current) return;
    printingRef.current = true;
    setStatus("Sending to printer…");
    const result = await api.print({ pageSize, copies, deviceName });
    setStatus(result.success
      ? result.usedSystemDialog
        ? "Printed using the Windows print settings window."
        : "Print job sent successfully."
      : result.failureReason || "Printing was cancelled.");
    printingRef.current = false;
  }

  const editPath = bill.id ? `/bills/${bill.id}/edit` : "/bills/new";
  const pageCount = pages.length;
  const totalSheets = pageCount * copies;

  return (
    <div className="preview-layout">
      <aside className="print-controls no-print">
        <div>
          <p className="eyebrow">Print setup</p>
          <h1>Ready to print</h1>
          <p>Check the bill, choose your paper and printer, then print.</p>
        </div>
        <label>Paper size
          <div className="segmented-control">
            {["A6", "A4"].map((size) => (
              <button className={pageSize === size ? "active" : ""} key={size} onClick={() => setPageSize(size)}>{size}</button>
            ))}
          </div>
        </label>
        <label>Printer
          <div className="select-with-action">
            <select value={deviceName} onChange={(event) => {
              setDeviceName(event.target.value);
              rememberPrinter(event.target.value);
            }}>
              {!printers.length && <option value="">System print dialog</option>}
              {printers.map((printer) => <option key={printer.name} value={printer.name}>{printer.displayName || printer.name}</option>)}
            </select>
            <button className="icon-button" onClick={loadPrinters} aria-label="Refresh printers"><RefreshCw size={17} /></button>
          </div>
        </label>
        <label>Number of copies
          <input
            ref={copiesInputRef}
            type="number"
            min="1"
            max="99"
            value={copies}
            onFocus={(event) => event.target.select()}
            onChange={(event) => setCopies(Math.max(1, Number(event.target.value) || 1))}
          />
        </label>
        <label>Invoice zoom
          <div className="zoom-control">
            <button className="icon-button" onClick={() => setZoom((value) => Math.max(35, value - 10))} aria-label="Zoom out">
              <ZoomOut size={17} />
            </button>
            <input
              type="range"
              min="35"
              max="160"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
            <button className="icon-button" onClick={() => setZoom((value) => Math.min(160, value + 10))} aria-label="Zoom in">
              <ZoomIn size={17} />
            </button>
          </div>
          <button className="fit-button" onClick={fitToView}><Maximize2 size={15} /> Fit to view · {zoom}%</button>
        </label>
        <p className="preview-page-count" aria-live="polite">
          <span>{pageCount} {pageCount === 1 ? "page" : "pages"} will print per copy</span>
          <small>{totalSheets} {totalSheets === 1 ? "sheet" : "sheets"} total for {copies} {copies === 1 ? "copy" : "copies"}</small>
        </p>
        {status && <p className="print-status">{status}</p>}
        <div className="print-control-actions">
          <button className="secondary-button" onClick={() => navigate(editPath, { state: { fromPreview: true } })}><Edit3 size={17} /> Edit bill</button>
          <button className="primary-button" onClick={handlePrint}><Printer size={17} /> Print {copies} {copies === 1 ? "copy" : "copies"}</button>
        </div>
      </aside>
      <div
        className="preview-canvas bill-preview-canvas"
        ref={previewRef}
        role="region"
        aria-label="Scrollable bill preview"
        tabIndex="0"
      >
        <div
          className="preview-paper-frame bill-preview-frame"
          style={{
            width: pagePixels.width * (zoom / 100),
            height: ((pagePixels.height * pageCount) + (24 * Math.max(0, pageCount - 1))) * (zoom / 100),
          }}
        >
          <div className="bill-preview-stack" style={{ "--preview-scale": zoom / 100 }}>
            {pages.map((pageRows, index) => (
              <BillDocument
                key={`${pageSize}-${index}`}
                bill={bill}
                pageSize={pageSize}
                rows={pageRows}
                showHeader={index === 0}
                showFooter={index === pageCount - 1}
                pageNumber={index + 1}
                pageCount={pageCount}
              />
            ))}
          </div>
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
    </div>
  );
}
