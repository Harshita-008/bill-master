import { api } from "../services/api";
import { activeSeconds, readSession } from "./activitySession";

// log a new bill or challan when it is printed or saved, never stops the user
export async function recordActivity(kind, action, details = {}) {
  const session = readSession(kind);
  if (!session) return;

  try {
    await api.recordActivity(kind, {
      session: session.id,
      action,
      seconds: activeSeconds(kind),
      items: details.items ?? 0,
      total: details.total ?? 0,
      recordId: details.recordId,
    });
  } catch {
    // the count is an extra, billing keeps working without it
  }
}
