import { ArrowRight } from "lucide-react";

export default function HomeHero({ onCreateBill }) {
  return (
    <div className="home-hero">
      <span className="home-badge">GST as applicable</span>
      <h1 className="home-title">Estimate</h1>
      <p className="home-text">Build a clean invoice in a few quick steps</p>

      <button className="home-create" onClick={onCreateBill} aria-label="Create new bill">
        Create new bill
        <span className="home-create-arrow">
          <ArrowRight size={18} />
        </span>
      </button>
    </div>
  );
}
