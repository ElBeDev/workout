/** Client-side queue of set logs that couldn't reach the server. */

export type PendingSet = {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  weight: string | null;
  reps: number | null;
  queuedAt: number;
};

const KEY = "workout:pending-sets";

function read(): PendingSet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PendingSet[]) : [];
  } catch {
    return [];
  }
}

function write(items: PendingSet[]) {
  try {
    if (items.length === 0) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
  window.dispatchEvent(new CustomEvent("workout:queue-changed"));
}

export function getPendingSets(sessionId?: string): PendingSet[] {
  const all = read();
  return sessionId ? all.filter((p) => p.sessionId === sessionId) : all;
}

export function enqueueSet(entry: Omit<PendingSet, "queuedAt">) {
  const all = read().filter(
    (p) =>
      !(
        p.sessionId === entry.sessionId &&
        p.exerciseId === entry.exerciseId &&
        p.setNumber === entry.setNumber
      )
  );
  all.push({ ...entry, queuedAt: Date.now() });
  write(all);
}

export function removePendingSets(entries: PendingSet[]) {
  const keys = new Set(entries.map((e) => `${e.sessionId}|${e.exerciseId}|${e.setNumber}`));
  write(read().filter((p) => !keys.has(`${p.sessionId}|${p.exerciseId}|${p.setNumber}`)));
}

export function findPendingSet(sessionId: string, exerciseId: string, setNumber: number) {
  return read().find(
    (p) => p.sessionId === sessionId && p.exerciseId === exerciseId && p.setNumber === setNumber
  );
}
