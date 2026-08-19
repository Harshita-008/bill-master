import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Edit3, Maximize2, Printer, RefreshCw, ZoomIn, ZoomOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ChallanDocument from "../components/challan/ChallanDocument";
import { api } from "../services/api";
import useEnterToPrint from "../hooks/useEnterToPrint";
import {
  cachePrinters,
  choosePrinter,
  PREFERRED_PRINTER_KEY,
  readCachedPrinters,
  rememberPrinter,
} from "../utils/printerCache";

export default function ChallanPrintPreviewPage() {
  const navigate = useNavigate();
  const challan = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("billmaster.challanPrintDraft"));
    } catch {
      return null;
    }
  }, []);
  const [pageSize, setPageSize] = useState("A6");
  const [copies, setCopies] = useState(2);
  const [printers, setPrinters] = useState(readCachedPrinters);
  const [deviceName, setDeviceName] = useState(() => localStorage.getItem(PREFERRED_PRINTER_KEY) || "");
  const [status, setStatus] = useState("");
  const [zoom, setZoom] = useState(100);
  const previewRef = useRef(null);
  const copiesInputRef = useRef(null);
  const printingRef = useRef(false);

  const pagePixels = pageSize === "A4"
    ? { width: 794, height: 1123 }
    : { width: 397, height: 559 };

  const fitToView = useCallback(() => {
    const preview = previewRef.current;
    if (!preview) return;
    const widthScale = (preview.clientWidth - 64) / pagePixels.width;
    const heightScale = (preview.clientHeight - 64) / pagePixels.height;
    setZoom(Math.max(35, Math.min(140, Math.floor(Math.min(widthScale, heightScale) * 100))));
  }, [pagePixels.height, pagePixels.width]);

  const applyPrinters = (available) => {
    const cached = cachePrinters(available);
    setPrinters(cached);
    const preferred = choosePrinter(cached, deviceName);
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
      const preferred = choosePrinter(cached, localStorage.getItem(PREFERRED_PRINTER_KEY) || "");
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

  useEnterToPrint(handlePrint, copiesInputRef);

  if (!challan) {
    return (
      <div className="empty-state">
        <h2>No challan to preview</h2>
        <button className="primary-button" onClick={() => navigate("/challans/new")}>Create challan</button>
      </div>
    );
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

  const editPath = challan.id ? `/challans/${challan.id}/edit` : "/challans/new";

  return (
    <div className="preview-layout">
      <aside className="print-controls no-print">
        <div>
          <p className="eyebrow">Challan print setup</p>
          <h1>Ready to print</h1>
          <p>Check the challan, choose the paper and printer, then print.</p>
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
            <button className="icon-button" onClick={async () => applyPrinters(await api.getPrinters(true))} aria-label="Refresh printers">
              <RefreshCw size={17} />
            </button>
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
        <label>Challan zoom
          <div className="zoom-control">
            <button className="icon-button" onClick={() => setZoom((value) => Math.max(35, value - 10))} aria-label="Zoom out"><ZoomOut size={17} /></button>
            <input type="range" min="35" max="160" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
            <button className="icon-button" onClick={() => setZoom((value) => Math.min(160, value + 10))} aria-label="Zoom in"><ZoomIn size={17} /></button>
          </div>
          <button className="fit-button" onClick={fitToView}><Maximize2 size={15} /> Fit to view · {zoom}%</button>
        </label>
        {status && <p className="print-status">{status}</p>}
        <div className="print-control-actions">
          <button className="secondary-button" onClick={() => navigate(editPath, { state: { fromPreview: true } })}>
            <Edit3 size={17} /> Edit challan
          </button>
          <button className="primary-button" onClick={handlePrint}>
            <Printer size={17} /> Print {copies} {copies === 1 ? "copy" : "copies"}
          </button>
        </div>
      </aside>
      <div className="preview-canvas" ref={previewRef}>
        <div className="preview-paper-frame" style={{ width: pagePixels.width * (zoom / 100), height: pagePixels.height * (zoom / 100) }}>
          <ChallanDocument challan={challan} pageSize={pageSize} previewScale={zoom / 100} />
        </div>
      </div>
    </div>
  );
}
