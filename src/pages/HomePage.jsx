import { ArrowRight, BookUser, ClipboardList, ClipboardPlus, FilePlus2, LibraryBig, PackagePlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const actions = [
  {
    path: "/bills/new",
    icon: FilePlus2,
    label: "Create new bill",
    description: "Build a clean invoice in a few quick steps.",
    accent: true,
  },
  {
    path: "/bills",
    icon: LibraryBig,
    label: "View bills",
    description: "Open a ledger to view, edit, and reprint its bills.",
  },
  {
    path: "/challans/new",
    icon: ClipboardPlus,
    label: "Create challan",
    description: "Prepare and print a simple delivery challan.",
    accent: true,
  },
  {
    path: "/challans",
    icon: ClipboardList,
    label: "View challans",
    description: "Open, edit, and reprint saved challans.",
  },
  {
    path: "/ledgers",
    icon: BookUser,
    label: "View ledgers",
    description: "Add, search, and delete saved ledger names.",
  },
  {
    path: "/items",
    icon: PackagePlus,
    label: "Manage items",
    description: "Add items manually or import an Excel sheet.",
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-title-lockup">
          <h1>Estimate</h1>
          <p><span /> GST as applicable</p>
        </div>
        <button className="primary-button hero-button" onClick={() => navigate("/bills/new")}>
          Create a bill <ArrowRight size={18} />
        </button>
        <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
      </section>

      <section className="quick-actions">
        {actions.map(({ path, icon: Icon, label, description, accent }) => (
          <button className={`action-card ${accent ? "accent-card" : ""}`} key={path} onClick={() => navigate(path)}>
            <span className="action-icon"><Icon size={23} /></span>
            <span className="action-copy"><strong>{label}</strong><small>{description}</small></span>
            <ArrowRight className="action-arrow" size={19} />
          </button>
        ))}
      </section>
    </div>
  );
}
