import { clearSession } from "./activitySession";

// forget the unsaved editor copy when leaving bills or challans
export function clearEditorDrafts(pathname) {
  if (pathname.startsWith("/bills/")) {
    sessionStorage.removeItem("billmaster.printDraft");
    sessionStorage.removeItem("billmaster.editorDraft");
    clearSession("bill");
  } else if (pathname.startsWith("/challans/")) {
    sessionStorage.removeItem("billmaster.challanPrintDraft");
    sessionStorage.removeItem("billmaster.challanEditorDraft");
    clearSession("challan");
  }
}
