/** XP, rangos y medallas (docs/gamificacion.md). */
const fmt = (n: number) => new Intl.NumberFormat("es-MX").format(n);

export const juego = {
  rangos: {
    bronce: "Bronce",
    plata: "Plata",
    oro: "Oro",
    platino: "Platino",
    diamante: "Diamante",
    campeon: "Campeón",
    leyenda: "Leyenda",
  } as Record<string, string>,
  rango: "Rango",
  xpTotal: (xp: number) => `${fmt(xp)} XP en total`,
  faltan: (xp: number, siguiente: string) => `Faltan ${fmt(xp)} XP para ${siguiente}`,
  maximo: "Llegaste al rango más alto",
  comoSeGana: "Ganas XP por venir (100 por día), por cada serie, por romper récords y por cumplir tu meta de días de la semana.",

  // Resumen de sesión
  ganaste: (xp: number) => `+${fmt(xp)} XP`,
  subiste: (rango: string) => `¡Subiste a ${rango}!`,
  nuevaMedalla: "Medalla nueva",
  nuevasMedallas: "Medallas nuevas",

  // Medallas
  logros: "Logros",
  medallasDe: (n: number, total: number) => `${n} de ${total}`,
  ganadaEl: (fecha: string) => `Ganada el ${fecha}`,
  bloqueada: "Por ganar",
  medalla: (group: string, n: number): { titulo: string; requisito: string } => {
    switch (group) {
      case "dias":
        return n === 1
          ? { titulo: "Primer día", requisito: "Tu primer entrenamiento" }
          : { titulo: `${fmt(n)} días`, requisito: `Entrena ${fmt(n)} días distintos` };
      case "racha":
        return { titulo: `${n} semanas seguidas`, requisito: `Entrena al menos una vez por semana, ${n} semanas seguidas` };
      case "anillos":
        return n === 1
          ? { titulo: "Semana perfecta", requisito: "Cierra los tres anillos en una semana" }
          : { titulo: `${n} semanas perfectas`, requisito: `Cierra los tres anillos en ${n} semanas` };
      case "records":
        return n === 1
          ? { titulo: "Primer récord", requisito: "Supera tu mejor marca en un ejercicio" }
          : { titulo: `${n} récords`, requisito: `Rompe ${n} récords personales` };
      case "toneladas":
        return { titulo: n === 1 ? "1 tonelada" : `${fmt(n)} toneladas`, requisito: `Levanta ${n === 1 ? "1 tonelada" : `${fmt(n)} toneladas`} en total` };
      case "natacion":
        return n === 42.2
          ? { titulo: "Maratón nadado", requisito: "Nada 42.2 km en total" }
          : { titulo: `${fmt(n)} km nadados`, requisito: `Nada ${fmt(n)} km en total` };
      case "retoCumplido":
        return { titulo: "Reto cumplido", requisito: "Llega a la meta de un reto del coach" };
      case "retoGanado":
        return { titulo: "Campeón de reto", requisito: "Gana un reto del coach" };
      default:
        return { titulo: group, requisito: "" };
    }
  },

  // Tarjeta de socio
  verPerfil: (nombre: string) => `Ver a ${nombre}`,
  racha: (semanas: number) => (semanas === 1 ? "1 semana seguida" : `${semanas} semanas seguidas`),
  sinRacha: "Sin racha ahora",
  dias: (n: number) => (n === 1 ? "1 día entrenado" : `${fmt(n)} días entrenados`),
  privado: "Sus pesos y sesiones sólo los ven esa persona y el coach.",
};
