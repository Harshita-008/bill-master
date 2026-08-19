import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import ThemeProvider from "./context/ThemeProvider";
import AppShell from "./components/layout/AppShell";
import HomePage from "./pages/HomePage";
import BillEditorPage from "./pages/BillEditorPage";
import BillsHistoryPage from "./pages/BillsHistoryPage";
import CompanyBillsPage from "./pages/CompanyBillsPage";
import BillDetailPage from "./pages/BillDetailPage";
import ItemMasterPage from "./pages/ItemMasterPage";
import LedgerMasterPage from "./pages/LedgerMasterPage";
import PrintPreviewPage from "./pages/PrintPreviewPage";
import ChallanEditorPage from "./pages/ChallanEditorPage";
import ChallanHistoryPage from "./pages/ChallanHistoryPage";
import ChallanDetailPage from "./pages/ChallanDetailPage";
import ChallanPrintPreviewPage from "./pages/ChallanPrintPreviewPage";

export default function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/bills" element={<BillsHistoryPage />} />
            <Route path="/bills/company/:companyName" element={<CompanyBillsPage />} />
            <Route path="/bills/new" element={<BillEditorPage />} />
            <Route path="/bills/:id" element={<BillDetailPage />} />
            <Route path="/bills/:id/edit" element={<BillEditorPage />} />
            <Route path="/items" element={<ItemMasterPage />} />
            <Route path="/ledgers" element={<LedgerMasterPage />} />
            <Route path="/print" element={<PrintPreviewPage />} />
            <Route path="/challans" element={<ChallanHistoryPage />} />
            <Route path="/challans/new" element={<ChallanEditorPage />} />
            <Route path="/challans/:id" element={<ChallanDetailPage />} />
            <Route path="/challans/:id/edit" element={<ChallanEditorPage />} />
            <Route path="/challan-print" element={<ChallanPrintPreviewPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}
