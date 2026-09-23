import { localDate } from "@/lib/dates";
import { getDict } from "@/i18n";
import { MiniRings } from "@/components/Rings";
import type { TrainingDay } from "@/db/queries";

const WEEKS = 14;

/**
 * Historial de constancia: cada día es un trío de anillos en miniatura, como
 * el calendario de Actividad de Fitness. Las metas diarias salen de repartir
 * las metas semanales entre los días que te propusiste entrenar.
 */
export async function ConsistencyCalendar({
  byDay,
  goals,
}: {
  byDay: Map<string, TrainingDay>;
  goals: { volumeKg: number; sets: number; days: number };
}) {
  const t = await getDict();
  const perDay = Math.max(goals.days, 1);
  const volumeTarget = Math.max(goals.volumeKg / perDay, 1);
  const setsTarget = Math.max(goals.sets / perDay, 1);

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

  const monthLabel = new Intl.DateTimeFormat(t.progreso.calendarioLocale, {
    month: "short",
    timeZone: "UTC",
  });
  const trainedDays = Array.from(byDay.values()).filter((d) => d.sets > 0).length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 overflow-x-auto pb-1">
        <div className="flex flex-col gap-1 pr-1 pt-4">
          {t.progreso.calendarioDias.map((l, i) => (
            <span key={i} className="flex h-4 items-center text-[10px] leading-none text-faint">
              {i % 2 === 0 ? l : ""}
            </span>
          ))}
        </div>
        {columns.map((col, i) => {
          const first = col[0];
          const showMonth = first.getUTCDate() <= 7 || i === 0;
          return (
            <div key={i} className="flex flex-col gap-1">
              <span className="h-3 text-[10px] leading-none text-faint">
                {showMonth ? monthLabel.format(first) : ""}
              </span>
              {col.map((day) => {
                const k = day.toISOString().slice(0, 10);
                const entry = byDay.get(k);
                const future = day > today;
                return (
                  <span
                    key={k}
                    title={
                      entry
                        ? t.progreso.calendarioDia(k, entry.sets, Math.round(entry.volumeKg))
                        : k
                    }
                    className={future ? "opacity-15" : undefined}
                  >
                    <MiniRings
                      size={16}
                      dim={!entry}
                      pcts={[
                        (entry?.volumeKg ?? 0) / volumeTarget,
                        (entry?.sets ?? 0) / setsTarget,
                        entry ? 1 : 0,
                      ]}
                    />
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
      <p className="text-[13px] text-muted">{t.progreso.calendarioResumen(trainedDays, WEEKS)}</p>
    </div>
  );
}
