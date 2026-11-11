import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Edit3, Maximize2, Printer, RefreshCw, ZoomIn, ZoomOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PaginatedBill from "../components/bill/PaginatedBill";
import { api } from "../services/api";
import useEnterToPrint from "../hooks/useEnterToPrint";
import { BILL_PAGE_LAYOUT } from "../utils/billPagination";
import { getManualDuplexPageRanges, getPhysicalSheetCount } from "../utils/manualDuplex";
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
  const [copies, setCopies] = useState("1");
  const [printers, setPrinters] = useState(readCachedPrinters);
  const [deviceName, setDeviceName] = useState(() => localStorage.getItem(PREFERRED_PRINTER_KEY) || "");
  const [status, setStatus] = useState("");
  const [zoom, setZoom] = useState(100);
  const [pageCount, setPageCount] = useState(1);
  const [printMode, setPrintMode] = useState("standard");
  const [awaitingFlip, setAwaitingFlip] = useState(false);
  const previewRef = useRef(null);
  const copiesInputRef = useRef(null);
  const printingRef = useRef(false);
  const pagePixels = BILL_PAGE_LAYOUT[pageSize];

  const fitToView = useCallback(() => {
    const preview = previewRef.current;
    if (!preview) return;
    const widthScale = (preview.clientWidth - 64) / pagePixels.width;
    const heightScale = (preview.clientHeight - 64) / pagePixels.height;
    setZoom(Math.max(35, Math.min(140, Math.floor(Math.min(widthScale, heightScale) * 100))));
  }, [pagePixels.height, pagePixels.width]);

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
    if (!awaitingFlip) return undefined;
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setAwaitingFlip(false);
      setStatus("Back sides were not printed.");
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [awaitingFlip]);

  useEnterToPrint(handlePrint, copiesInputRef);

  if (!bill) {
    return <div className="empty-state"><h2>No bill to preview</h2><p>Return to the editor and prepare a bill first.</p><button className="primary-button" onClick={() => navigate("/bills/new")}>Create bill</button></div>;
  }

  async function handlePrint() {
    if (printingRef.current || awaitingFlip) return;
    printingRef.current = true;
    const printCopies = Math.max(1, Number(copies) || 1);
    setCopies(String(printCopies));
    const manualDuplexJob = printMode === "manual-duplex" && pageCount > 1;
    setStatus("Sending to printer…");
    if (manualDuplexJob) setStatus("Printing front sides (pages 1, 3, 5...)...");
    const result = await api.print({
      pageSize,
      copies: printCopies,
      deviceName,
      pageRanges: manualDuplexJob ? getManualDuplexPageRanges(pageCount, "front") : undefined,
    });
    setStatus(result.success
      ? result.usedSystemDialog
        ? "Printed using the Windows print settings window."
        : result.seconds != null ? `Print job sent in ${result.seconds} s.` : "Print job sent successfully."
      : result.failureReason || "Printing was cancelled.");
    if (result.success && manualDuplexJob) setStatus("Front sides sent successfully.");
    printingRef.current = false;
    if (result.success && manualDuplexJob) setAwaitingFlip(true);
  }

  async function printBackSides() {
    if (printingRef.current) return;
    printingRef.current = true;
    const printCopies = Math.max(1, Number(copies) || 1);
    setCopies(String(printCopies));
    setStatus("Printing back sides (pages 2, 4, 6...)...");
    const result = await api.print({
      pageSize,
      copies: printCopies,
      deviceName,
      pageRanges: getManualDuplexPageRanges(pageCount, "back"),
    });
    setStatus(result.success
      ? "Front and back printing completed."
      : result.failureReason || "Back-side printing was cancelled.");
    printingRef.current = false;
    if (result.success) setAwaitingFlip(false);
  }

  const editPath = bill.id ? `/bills/${bill.id}/edit` : "/bills/new";
  const manualDuplex = printMode === "manual-duplex";
  const effectiveCopies = Math.max(1, Number(copies) || 1);
  const totalSheets = getPhysicalSheetCount(pageCount, effectiveCopies, manualDuplex);

  return (
    <div className="preview-layout">
      <aside className="print-controls no-print">
        <div>
          <p className="eyebrow">Print setup</p>
          <h1>Ready to print</h1>
          <p>Check the bill, choose your paper and printer, then print.</p>
        </div>
        <div className="print-control-row">
          <label>Paper size
            <div className="segmented-control">
              {["A6", "A4"].map((size) => (
                <button className={pageSize === size ? "active" : ""} key={size} onClick={() => setPageSize(size)}>{size}</button>
              ))}
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
              onChange={(event) => setCopies(event.target.value)}
              onBlur={() => setCopies((value) => String(Math.max(1, Number(value) || 1)))}
            />
          </label>
        </div>
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
        <label>Print method
          <div className="segmented-control print-method-control">
            <button
              type="button"
              className={printMode === "standard" ? "active" : ""}
              aria-pressed={printMode === "standard"}
              onClick={() => setPrintMode("standard")}
            >
              <Printer size={15} /> Print
            </button>
            <button
              type="button"
              className={printMode === "manual-duplex" ? "active" : ""}
              aria-pressed={printMode === "manual-duplex"}
              onClick={() => setPrintMode("manual-duplex")}
            >
              <BookOpen size={15} /> Front &amp; back
            </button>
          </div>
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
          <small>{totalSheets} physical {totalSheets === 1 ? "sheet" : "sheets"} for {effectiveCopies} {effectiveCopies === 1 ? "copy" : "copies"}{manualDuplex ? " using both sides" : ""}</small>
        </p>
        {status && <p className="print-status">{status}</p>}
        <div className="print-control-actions">
          <button className="secondary-button" onClick={() => navigate(editPath, { state: { fromPreview: true } })}><Edit3 size={17} /> Edit bill</button>
          <button className="primary-button" onClick={handlePrint}>
            <Printer size={17} /> {manualDuplex && pageCount > 1 ? "Start front & back" : `Print ${effectiveCopies} ${effectiveCopies === 1 ? "copy" : "copies"}`}
          </button>
        </div>
      </aside>
      <div
        className="preview-canvas bill-preview-canvas"
        ref={previewRef}
        role="region"
        aria-label="Scrollable bill preview"
        tabIndex="0"
      >
        <PaginatedBill
          bill={bill}
          pageSize={pageSize}
          scale={zoom / 100}
          onPageCountChange={setPageCount}
        />
      </div>
      {awaitingFlip && (
        <div className="manual-duplex-overlay no-print" role="dialog" aria-modal="true" aria-labelledby="manual-duplex-title">
          <div className="manual-duplex-dialog">
            <div className="manual-duplex-icon"><BookOpen size={24} /></div>
            <div>
              <p className="eyebrow">Front sides sent</p>
              <h2 id="manual-duplex-title">Flip and reinsert the printed sheets</h2>
              <p>Wait until pages 1, 3, 5... finish printing. Flip the complete stack and place it back in the printer using the orientation required by your printer.</p>
              <p className="manual-duplex-warning">Do not continue until the paper is correctly reloaded.</p>
            </div>
            <div className="manual-duplex-actions">
              <button className="secondary-button" onClick={() => {
                setAwaitingFlip(false);
                setStatus("Back sides were not printed.");
              }}>Cancel</button>
              <button className="primary-button" autoFocus onClick={printBackSides}><Printer size={17} /> Print back sides</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
