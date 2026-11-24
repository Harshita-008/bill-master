export default function InsightCard({ title, note, children }) {
  return (
    <section className="insight-card" aria-label={title}>
      <div className="insight-card-head">
        <h2>{title}</h2>
        {note && <p>{note}</p>}
      </div>
      {children}
    </section>
  );
}
