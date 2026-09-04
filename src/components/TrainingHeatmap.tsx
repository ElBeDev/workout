import { localDate } from "@/lib/dates";

const WEEKS = 16;
const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

function key(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Days trained over the last 16 weeks, GitHub-style. Server component. */
export function TrainingHeatmap({ sessionDates }: { sessionDates: Date[] }) {
  const counts = new Map<string, number>();
  for (const d of sessionDates) {
    const k = key(localDate(d));
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  // Grid ends on today's week (Monday-based columns).
  const today = localDate(new Date());
  today.setUTCHours(0, 0, 0, 0);
  const mondayOffset = (today.getUTCDay() + 6) % 7;
  const start = new Date(today);
  start.setUTCDate(today.getUTCDate() - mondayOffset - (WEEKS - 1) * 7);

  const columns: Date[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const col: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setUTCDate(start.getUTCDate() + w * 7 + d);
      col.push(day);
    }
    columns.push(col);
  }

  const monthLabel = new Intl.DateTimeFormat("es-MX", { month: "short", timeZone: "UTC" });
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 overflow-x-auto pb-1">
        <div className="flex flex-col gap-1 pr-1 pt-4">
          {DAY_LABELS.map((l, i) => (
            <span key={l} className="flex h-3 items-center text-[9px] leading-none text-muted">
              {i % 2 === 0 ? l : ""}
            </span>
          ))}
        </div>
        {columns.map((col, i) => {
          const first = col[0];
          const showMonth = first.getUTCDate() <= 7 || i === 0;
          return (
            <div key={i} className="flex flex-col gap-1">
              <span className="h-3 text-[9px] leading-none text-muted">
                {showMonth ? monthLabel.format(first) : ""}
              </span>
              {col.map((day) => {
                const k = key(day);
                const n = counts.get(k) ?? 0;
                const future = day > today;
                const tone = future
                  ? "bg-transparent"
                  : n === 0
                    ? "bg-surface-2"
                    : n === 1
                      ? "bg-accent"
                      : "bg-accent-strong";
                return (
                  <span
                    key={k}
                    title={`${k}${n ? ` · ${n} ${n === 1 ? "sesión" : "sesiones"}` : ""}`}
                    className={`h-3 w-3 rounded-[3px] ${tone}`}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-muted">
        {total} {total === 1 ? "sesión" : "sesiones"} en las últimas {WEEKS} semanas
      </p>
    </div>
  );
}
