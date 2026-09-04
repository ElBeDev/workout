"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CloudOff, RefreshCw } from "lucide-react";
import { getPendingSets, removePendingSets } from "@/lib/offline-queue";
import { syncSets } from "./actions";

/** Replays queued sets when the connection comes back; shows how many are waiting. */
export function PendingSync({ sessionId }: { sessionId: string }) {
  const [count, setCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const router = useRouter();

  const refreshCount = useCallback(() => setCount(getPendingSets(sessionId).length), [sessionId]);

  const sync = useCallback(async () => {
    const pending = getPendingSets();
    if (pending.length === 0 || !navigator.onLine) return;
    setSyncing(true);
    try {
      const saved = await syncSets(
        pending.map(({ sessionId, exerciseId, setNumber, weight, reps }) => ({
          sessionId,
          exerciseId,
          setNumber,
          weight,
          reps,
        }))
      );
      removePendingSets(saved.map((s) => ({ ...s, queuedAt: 0 })));
      if (saved.length > 0) router.refresh();
    } catch {
      // still offline or server unreachable; keep the queue
    } finally {
      setSyncing(false);
    }
  }, [router]);

  useEffect(() => {
    const id = setTimeout(() => {
      refreshCount();
      void sync();
    }, 0);
    const onOnline = () => void sync();
    window.addEventListener("online", onOnline);
    window.addEventListener("workout:queue-changed", refreshCount);
    // Some browsers/PWAs don't fire "online" reliably; retry on a timer too.
    const interval = setInterval(() => {
      if (getPendingSets().length > 0) void sync();
    }, 15000);
    return () => {
      clearTimeout(id);
      clearInterval(interval);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("workout:queue-changed", refreshCount);
    };
  }, [sync, refreshCount]);

  if (count === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-amber-400/20 px-4 py-3 text-[13px]">
      <CloudOff className="h-4 w-4 shrink-0 text-amber-600" />
      <p className="flex-1">
        <span className="font-semibold">{count}</span> {count === 1 ? "serie guardada" : "series guardadas"} sin señal.
        Se sincronizan solas al reconectar.
      </p>
      <button
        type="button"
        onClick={() => void sync()}
        disabled={syncing}
        aria-label="Sincronizar ahora"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}
