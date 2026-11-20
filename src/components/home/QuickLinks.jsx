export default function QuickLinks({ links, onOpen }) {
  return (
    <nav className="quick-links" aria-label="More options">
      {links.map((link) => {
        const Icon = link.icon;

        return (
          <button
            key={link.path}
            className="quick-link"
            style={{ "--hue": link.hue }}
            title={link.description}
            onClick={() => onOpen(link.path)}
          >
            <span className="quick-link-icon">
              <Icon size={16} />
            </span>
            {link.label}
          </button>
        );
      })}
    </nav>
  );
}
