import { LogOut } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";

// what = "bill" or "challan"
export default function ExitDialog({ what = "bill", onYes, onNo }) {
  return (
    <ConfirmDialog
      icon={LogOut}
      className="exit-dialog"
      title="Do you want to exit?"
      message={`Anything not saved on this ${what} will be lost.`}
      onYes={onYes}
      onNo={onNo}
    />
  );
}
