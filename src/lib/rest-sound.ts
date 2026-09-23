/**
 * Aviso sonoro del fin del descanso: tres pitidos cortos y seguidos.
 *
 * Se generan con la Web Audio API en vez de un archivo de audio — no hay nada
 * que descargar ni que cachear en el service worker, y suena igual sin señal.
 *
 * iOS no deja sonar a una página que no haya recibido un gesto del usuario, y
 * el fin del descanso NO es un gesto. Por eso `desbloquearSonido()` se llama en
 * el toque del ✓ (que es lo que arranca el descanso): ahí sí hay gesto, y el
 * AudioContext queda vivo para cuando el cronómetro llegue a cero.
 */

const CLAVE_SONIDO = "workout:sonido-descanso";

let ctx: AudioContext | null = null;

function crearCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    return Ctor ? new Ctor() : null;
  } catch {
    return null;
  }
}

/** Llamar SIEMPRE desde un manejador de gesto (click/tap). */
export function desbloquearSonido() {
  if (!sonidoActivado()) return;
  ctx ??= crearCtx();
  if (ctx?.state === "suspended") void ctx.resume();
}

export function sonidoActivado(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(CLAVE_SONIDO) !== "off";
  } catch {
    return true;
  }
}

export function setSonidoActivado(activo: boolean) {
  try {
    localStorage.setItem(CLAVE_SONIDO, activo ? "on" : "off");
  } catch {}
  if (activo) desbloquearSonido();
}

/** Tres pitidos de 120 ms con 90 ms de silencio entre ellos. */
export function sonarFinDescanso() {
  if (!sonidoActivado() || !ctx || ctx.state !== "running") return;
  const inicio = ctx.currentTime;
  for (let i = 0; i < 3; i++) {
    const t = inicio + i * 0.21;
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, t);
    // Rampas cortas en vez de encender/apagar en seco: sin ellas se oye un clic.
    vol.gain.setValueAtTime(0, t);
    vol.gain.linearRampToValueAtTime(0.3, t + 0.012);
    vol.gain.setValueAtTime(0.3, t + 0.105);
    vol.gain.linearRampToValueAtTime(0, t + 0.12);
    osc.connect(vol);
    vol.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.14);
  }
}

/** Para probarlo desde el interruptor de Perfil. */
export function probarSonido() {
  desbloquearSonido();
  // El contexto recién creado tarda un instante en pasar a "running".
  setTimeout(sonarFinDescanso, 60);
}
