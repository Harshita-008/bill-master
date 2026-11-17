import { LogOut } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";

export default function ExitDialog({ onYes, onNo }) {
  return (
    <ConfirmDialog
      icon={LogOut}
      className="exit-dialog"
      title="Do you want to exit?"
      message="Anything not saved on this bill will be lost."
      onYes={onYes}
      onNo={onNo}
    />
  );
}
