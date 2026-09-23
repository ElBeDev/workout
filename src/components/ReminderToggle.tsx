"use client";

import { useState, useTransition } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { borrarSuscripcion, guardarSuscripcion, probarAviso } from "@/app/perfil/push-actions";

function base64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/**
 * Recordatorio de "hoy toca". En iPhone las notificaciones web sólo funcionan
 * con la app **instalada en la pantalla de inicio**; si no lo está, se dice en
 * vez de dejar al usuario esperando un aviso que nunca va a llegar.
 */
export function ReminderToggle({
  activo: activoInicial,
  publicKey,
}: {
  activo: boolean;
  publicKey: string;
}) {
  const t = useT().perfil;
  const [activo, setActivo] = useState(activoInicial);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  async function activar() {
    setMensaje(null);
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setMensaje(t.recordatorio.noSoportado);
      return;
    }
    const permiso = await Notification.requestPermission();
    if (permiso !== "granted") {
      setMensaje(t.recordatorio.permisoDenegado);
      return;
    }
    const reg = await navigator.serviceWorker.ready;
    // `subscribe` puede fallar aunque el permiso esté dado: pasa en ventanas de
    // incógnito (Chrome no soporta la Push API ahí) y cuando el navegador no
    // logra hablar con su servicio de push. Sin este catch el interruptor se
    // queda muerto y sin explicación.
    let sub: PushSubscription;
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(publicKey),
      });
    } catch {
      setMensaje(t.recordatorio.noSoportado);
      return;
    }
    const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    startTransition(async () => {
      const r = await guardarSuscripcion({
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      });
      if (r.ok) {
        setActivo(true);
        setMensaje(t.recordatorio.listo);
      } else {
        setMensaje(t.recordatorio.fallo);
      }
    });
  }

  async function desactivar() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      startTransition(async () => {
        await borrarSuscripcion(sub.endpoint);
        setActivo(false);
        setMensaje(null);
      });
    } else {
      setActivo(false);
    }
  }



  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
          {activo ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-semibold">{t.recordatorio.titulo}</span>
          <span className="block text-[13px] text-muted">{t.recordatorio.ayuda}</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={activo}
          aria-label={t.recordatorio.titulo}
          disabled={pendiente}
          onClick={() => (activo ? desactivar() : activar())}
          className={`relative h-8 w-[52px] shrink-0 rounded-full transition disabled:opacity-60 ${
            activo ? "bg-sets" : "bg-surface-3"
          }`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
              activo ? "left-[24px]" : "left-1"
            }`}
          />
        </button>
      </div>

      {activo && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] text-muted">{t.recordatorio.cuando}</span>
          <button
            type="button"
            disabled={pendiente}
            onClick={() =>
              startTransition(async () => {
                const r = await probarAviso();
                setMensaje(r.enviados > 0 ? t.recordatorio.pruebaEnviada : t.recordatorio.pruebaFallo);
              })
            }
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-4 text-[14px] font-semibold"
          >
            {pendiente ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t.recordatorio.probar}
          </button>
        </div>
      )}

      {mensaje && <p className="text-[13px] text-muted">{mensaje}</p>}
    </div>
  );
}
