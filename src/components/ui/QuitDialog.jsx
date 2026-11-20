import { LogOut } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";

export default function QuitDialog({ onYes, onNo }) {
  return (
    <ConfirmDialog
      icon={LogOut}
      className="exit-dialog"
      title="Do you want to exit?"
      message="BillMaster will close."
      onYes={onYes}
      onNo={onNo}
    />
  );
}
