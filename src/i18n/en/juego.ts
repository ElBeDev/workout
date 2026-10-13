import type { juego as Es } from "../es/juego";

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

/** XP, ranks and medals (docs/gamificacion.md). Rank names stay in Spanish on purpose. */
export const juego: typeof Es = {
  rangos: {
    bronce: "Bronce",
    plata: "Plata",
    oro: "Oro",
    platino: "Platino",
    diamante: "Diamante",
    campeon: "Campeón",
    leyenda: "Leyenda",
  },
  rango: "Rank",
  xpTotal: (xp) => `${fmt(xp)} XP total`,
  faltan: (xp, siguiente) => `${fmt(xp)} XP to ${siguiente}`,
  maximo: "You reached the top rank",
  comoSeGana: "You earn XP for showing up (100 per day), for every set, for breaking records and for hitting your weekly days goal.",

  ganaste: (xp) => `+${fmt(xp)} XP`,
  subiste: (rango) => `You ranked up to ${rango}!`,
  nuevaMedalla: "New medal",
  nuevasMedallas: "New medals",

  logros: "Achievements",
  medallasDe: (n, total) => `${n} of ${total}`,
  ganadaEl: (fecha) => `Earned ${fecha}`,
  bloqueada: "Locked",
  medalla: (group, n) => {
    switch (group) {
      case "dias":
        return n === 1
          ? { titulo: "First day", requisito: "Your first workout" }
          : { titulo: `${fmt(n)} days`, requisito: `Train on ${fmt(n)} different days` };
      case "racha":
        return { titulo: `${n}-week streak`, requisito: `Train at least once a week, ${n} weeks in a row` };
      case "anillos":
        return n === 1
          ? { titulo: "Perfect week", requisito: "Close all three rings in a week" }
          : { titulo: `${n} perfect weeks`, requisito: `Close all three rings in ${n} weeks` };
      case "records":
        return n === 1
          ? { titulo: "First record", requisito: "Beat your best on an exercise" }
          : { titulo: `${n} records`, requisito: `Break ${n} personal records` };
      case "toneladas":
        return { titulo: n === 1 ? "1 tonne" : `${fmt(n)} tonnes`, requisito: `Lift ${n === 1 ? "1 tonne" : `${fmt(n)} tonnes`} in total` };
      case "natacion":
        return n === 42.2
          ? { titulo: "Swim marathon", requisito: "Swim 42.2 km in total" }
          : { titulo: `${fmt(n)} km swum`, requisito: `Swim ${fmt(n)} km in total` };
      case "retoCumplido":
        return { titulo: "Challenge done", requisito: "Reach the goal of a coach challenge" };
      case "retoGanado":
        return { titulo: "Challenge champion", requisito: "Win a coach challenge" };
      default:
        return { titulo: group, requisito: "" };
    }
  },

  verPerfil: (nombre) => `See ${nombre}`,
  racha: (semanas) => (semanas === 1 ? "1-week streak" : `${semanas}-week streak`),
  sinRacha: "No streak right now",
  dias: (n) => (n === 1 ? "1 day trained" : `${fmt(n)} days trained`),
  privado: "Their weights and sessions are only visible to them and the coach.",
};
