import { TriangleAlert } from "lucide-react";
import ChoiceDialog from "../ui/ChoiceDialog";

// like tally: the item name is already saved
export default function NameExistsDialog({ name, onClose }) {
  const choices = [{ letter: "o", label: "OK", className: "primary-button", onPick: onClose }];
  return (
    <ChoiceDialog
      icon={TriangleAlert}
      danger
      className="name-exists-dialog"
      title="Name already exists"
      message={`${name} is already saved. Enter a different name.`}
      choices={choices}
    />
  );
}
