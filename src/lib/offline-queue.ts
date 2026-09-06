/** Client-side queue of set logs that couldn't reach the server (per user). */

export type PendingSet = {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  weight: string | null;
  plates: number | null;
  reps: number | null;
  queuedAt: number;
};

export type SetKey = Pick<PendingSet, "sessionId" | "exerciseId" | "setNumber">;

const PREFIX = "workout:pending-sets:";
const keyOf = (userId: string) => `${PREFIX}${userId}`;
const idOf = (e: SetKey) => `${e.sessionId}|${e.exerciseId}|${e.setNumber}`;

function read(userId: string): PendingSet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(keyOf(userId));
    return raw ? (JSON.parse(raw) as PendingSet[]) : [];
  } catch {
    return [];
  }
}

function write(userId: string, items: PendingSet[]) {
  try {
    if (items.length === 0) localStorage.removeItem(keyOf(userId));
    else localStorage.setItem(keyOf(userId), JSON.stringify(items));
  } catch {}
  window.dispatchEvent(new CustomEvent("workout:queue-changed"));
}

export function getPendingSets(userId: string, sessionId?: string): PendingSet[] {
  const all = read(userId);
  return sessionId ? all.filter((p) => p.sessionId === sessionId) : all;
}

export function enqueueSet(userId: string, entry: Omit<PendingSet, "queuedAt">) {
  const all = read(userId).filter((p) => idOf(p) !== idOf(entry));
  all.push({ ...entry, queuedAt: Date.now() });
  write(userId, all);
}

export function removePendingSets(userId: string, entries: SetKey[]) {
  const ids = new Set(entries.map(idOf));
  write(userId, read(userId).filter((p) => !ids.has(idOf(p))));
}

export function findPendingSet(userId: string, sessionId: string, exerciseId: string, setNumber: number) {
  return read(userId).find(
    (p) => p.sessionId === sessionId && p.exerciseId === exerciseId && p.setNumber === setNumber
  );
}
