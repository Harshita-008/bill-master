import ChoiceDialog from "./ChoiceDialog";

// yes / no box: y or n, arrows move between them, enter picks
export default function ConfirmDialog({ onYes, onNo, danger = false, ...rest }) {
  const choices = [
    { letter: "n", label: "No", className: "secondary-button", onPick: onNo },
    { letter: "y", label: "Yes", className: danger ? "danger-button" : "primary-button", onPick: onYes },
  ];
  return <ChoiceDialog {...rest} danger={danger} choices={choices} />;
}
