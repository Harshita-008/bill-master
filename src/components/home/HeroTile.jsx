import { ArrowRight } from "lucide-react";

export default function HeroTile({ onClick }) {
  return (
    <button className="bento-hero" onClick={onClick} aria-label="Create new bill">
      <span className="bento-orb" />
      <span className="bento-hero-title">
        <strong>Estimate</strong>
        <span className="bento-badge"><span /> GST as applicable</span>
      </span>
      <span className="bento-hero-action">
        <span className="tile-copy">
          <strong>Create new bill</strong>
          <small>Build a clean invoice in a few quick steps</small>
        </span>
        <span className="bento-hero-arrow"><ArrowRight size={24} /></span>
      </span>
    </button>
  );
}
