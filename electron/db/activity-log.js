// one row per bill or challan made, kept even when the bill itself is deleted
function logSchema(table) {
  return `
    CREATE TABLE IF NOT EXISTS ${table} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session TEXT NOT NULL UNIQUE,
      record_id INTEGER,
      made_at TEXT NOT NULL,
      items INTEGER NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      seconds INTEGER,
      printed INTEGER NOT NULL DEFAULT 0,
      saved INTEGER NOT NULL DEFAULT 0
    );
  `;
}

export function openActivityLog(db, table) {
  db.exec(logSchema(table));
}

// add saved records that are not in the log yet (older bills, or a missed entry)
export function addMissingToLog(db, table, selectSql) {
  db.exec(`
    INSERT INTO ${table} (session, record_id, made_at, items, total, saved)
    ${selectSql}
    WHERE id NOT IN (SELECT record_id FROM ${table} WHERE record_id IS NOT NULL)
  `);
}

function cleanEntry(entry) {
  const seconds = Number(entry?.seconds);
  return {
    session: String(entry?.session ?? "").trim(),
    action: entry?.action,
    recordId: Number(entry?.recordId) || null,
    items: Math.max(0, Math.trunc(Number(entry?.items) || 0)),
    total: Number(entry?.total) || 0,
    seconds: Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds) : null,
  };
}

// first print or save adds the row, later ones only mark it
export function recordActivity(db, table, rawEntry) {
  const entry = cleanEntry(rawEntry);
  if (!entry.session) throw new Error("Activity needs a session.");
  const printed = entry.action === "print" ? 1 : 0;
  const saved = entry.action === "save" ? 1 : 0;
  const existing = db.prepare(`SELECT id FROM ${table} WHERE session = ?`).get(entry.session);

  if (existing) {
    db.prepare(`
      UPDATE ${table}
      SET printed = MAX(printed, ?), saved = MAX(saved, ?), items = ?, total = ?,
          record_id = COALESCE(record_id, ?)
      WHERE id = ?
    `).run(printed, saved, entry.items, entry.total, entry.recordId ?? null, existing.id);
    return { added: false };
  }

  db.prepare(`
    INSERT INTO ${table} (session, record_id, made_at, items, total, seconds, printed, saved)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    entry.session,
    entry.recordId ?? null,
    new Date().toISOString(),
    entry.items,
    entry.total,
    entry.seconds ?? null,
    printed,
    saved,
  );
  return { added: true };
}

export function listActivity(db, table) {
  return db.prepare(`
    SELECT made_at AS madeAt, items, total, seconds, printed, saved
    FROM ${table}
    ORDER BY made_at
  `).all();
}
