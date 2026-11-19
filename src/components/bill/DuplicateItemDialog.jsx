import { Copy } from "lucide-react";
import ChoiceDialog from "../ui/ChoiceDialog";

// item is already in the bill: keep it again, clear it, or go to the old entry
export default function DuplicateItemDialog({ name, onYes, onNo, onSameEntry }) {
  const choices = [
    { letter: "n", label: "No", className: "secondary-button", onPick: onNo },
    { letter: "y", label: "Yes", className: "primary-button", onPick: onYes },
    { letter: "s", label: "Same entry", className: "secondary-button", onPick: onSameEntry },
  ];
  return (
    <ChoiceDialog
      icon={Copy}
      className="duplicate-dialog"
      title="Duplicate entry"
      message={`${name} is already in this bill. Add it again?`}
      hint="Y = Yes, N = No, S = go to the Same entry"
      choices={choices}
    />
  );
}
