// one session per new bill or challan, so printing it again is not counted twice
const KEYS = {
  bill: "billmaster.billSession",
  challan: "billmaster.challanSession",
};

// breaks longer than this do not count as time spent on the bill
const MAX_GAP_MS = 2 * 60 * 1000;

function read(kind) {
  try {
    return JSON.parse(sessionStorage.getItem(KEYS[kind]));
  } catch {
    return null;
  }
}

function write(kind, session) {
  sessionStorage.setItem(KEYS[kind], JSON.stringify(session));
}

export function startSession(kind, now = Date.now()) {
  write(kind, { id: crypto.randomUUID(), activeMs: 0, lastAt: now });
}

export function clearSession(kind) {
  sessionStorage.removeItem(KEYS[kind]);
}

export function readSession(kind) {
  return read(kind);
}

// a new bill starts a session, an old one opened for editing is not counted
export function beginEditorSession(kind, isSavedRecord, cameFromPreview) {
  if (cameFromPreview) return;
  if (isSavedRecord) clearSession(kind);
  else startSession(kind);
}

// add the time since the last key press or click, skipping long breaks
export function markActive(kind, now = Date.now()) {
  const session = read(kind);
  if (!session) return;
  const gap = now - session.lastAt;
  const counted = gap > 0 && gap <= MAX_GAP_MS ? gap : 0;
  write(kind, { ...session, activeMs: session.activeMs + counted, lastAt: now });
}

export function activeSeconds(kind) {
  const session = read(kind);
  return session ? Math.round(session.activeMs / 1000) : 0;
}
