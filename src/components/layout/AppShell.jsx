import { useCallback, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/theme-context";

function clearEditorDrafts(pathname) {
  if (pathname.startsWith("/bills/")) {
    sessionStorage.removeItem("billmaster.printDraft");
    sessionStorage.removeItem("billmaster.editorDraft");
  } else if (pathname.startsWith("/challans/")) {
    sessionStorage.removeItem("billmaster.challanPrintDraft");
    sessionStorage.removeItem("billmaster.challanEditorDraft");
  }
}

export default function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const isPrint = location.pathname === "/print" || location.pathname === "/challan-print";
  const isBillDetail = /^\/bills\/\d+$/.test(location.pathname);
  const goBack = useCallback(() => {
    const savedChallanEdit = location.pathname.match(/^\/challans\/([^/]+)\/edit$/);
    if (isPrint && location.state?.returnTo) {
      navigate(location.state.returnTo, {
        state: {
          fromPreview: true,
          savedId: location.state.savedId,
        },
      });
    } else if (savedChallanEdit) {
      clearEditorDrafts(location.pathname);
      navigate(`/challans/${savedChallanEdit[1]}`, { replace: true });
    } else if (location.pathname === "/challans/new") {
      clearEditorDrafts(location.pathname);
      navigate("/", { replace: true });
    } else if (/^\/challans\/[^/]+$/.test(location.pathname)) {
      clearEditorDrafts(location.pathname);
      navigate("/challans", { replace: true });
    } else if (location.pathname === "/challans") {
      navigate("/", { replace: true });
    } else if (
      /^\/bills\/\d+$/.test(location.pathname)
      && location.state?.returnTo?.startsWith("/bills/company/")
    ) {
      navigate(location.state.returnTo, { replace: true });
    } else if (/^\/bills\/company\/[^/]+$/.test(location.pathname)) {
      navigate("/bills", { replace: true });
    } else if (location.pathname === "/bills") {
      navigate("/", { replace: true });
    } else if (
      location.pathname.startsWith("/bills/")
      || location.pathname.endsWith("/edit")
    ) {
      clearEditorDrafts(location.pathname);
      navigate("/", { replace: true });
    } else {
      navigate(-1);
    }
  }, [isPrint, location.pathname, location.state, navigate]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (document.querySelector('[role="dialog"]')) return;
      event.preventDefault();
      goBack();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [goBack]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  return (
    <div className={`app-shell ${isPrint ? "print-route" : ""} ${isBillDetail ? "bill-detail-route" : ""}`}>
      <header className="topbar no-print">
        <button className="brand" onClick={() => navigate("/")} aria-label="BillMaster home">
          <img className="brand-mark" src="./billmaster-icon.png" alt="" />
          <span>BillMaster</span>
        </button>
        <div className="topbar-actions">
          {!isHome && (
            <button className="icon-button back-button" onClick={goBack} aria-label="Go back">
              <ArrowLeft size={19} />
            </button>
          )}
          <button className="icon-button" onClick={toggleTheme} aria-label={`Use ${theme === "dark" ? "light" : "dark"} mode`}>
            {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </div>
      </header>
      <main className={isPrint ? "print-main" : `app-main ${isBillDetail ? "bill-detail-main" : ""}`}>
        <Outlet />
      </main>
    </div>
  );
}
