import { ArrowRight } from "lucide-react";

export default function ActionTile({ icon: Icon, label, description, size, accent, onClick }) {
  return (
    <button className={`bento-tile tile-${size}${accent ? " tile-accent" : ""}`} onClick={onClick}>
      <span className="tile-icon"><Icon size={22} /></span>
      <span className="tile-copy">
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <ArrowRight className="tile-arrow" size={20} />
    </button>
  );
}
