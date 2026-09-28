import type { admin as Es } from "../es/admin";

/** Panel de administrador y mantenimiento. */
export const admin: typeof Es = {
  // Listado de usuarios
  titulo: "Coach",
  subtitulo: "How every member is doing",
  usuarios: "Users",
  sinUsuario: "No username",
  tu: "you",
  rutinas: (n: number) => `${n} ${n === 1 ? "routine" : "routines"}`,

  // Panel del coach
  requierenAtencion: (dias: number) => `Haven't come in ${dias}+ days`,
  activos: "Active",
  todosActivos: (dias: number) => `Nobody has gone ${dias} days without coming.`,
  nuncaHaEntrenado: "Never trained",
  sinRutinas: "no routines",
  resumen30: (dias: number, series: number) =>
    `${dias} ${dias === 1 ? "day" : "days"} · ${series} ${series === 1 ? "set" : "sets"} in 30 days`,
  retosTitulo: "Gym challenges",
  retosDescripcion: "Create and delete challenges for everyone",

  // Mantenimiento (respaldo de gifs)
  mantenimiento: "Maintenance",
  respaldoExplicacion:
    "Backup of the catalog gifs on our own storage. New exercises are copied automatically when you add them; the button catches up on the old ones. The diagnostics tell you which piece is failing when nothing gets copied.",
  respaldoSinToken: "No BLOB_READ_WRITE_TOKEN in this environment: the backup won't run.",

  // Detalle de un usuario
  usuario: {
    tituloSinNombre: "User",
    subtitulo: "This user's routines",
    ultimaActividad: "Last trained",
    estaSemana: "This week",
    ultimos30: "Last 30 days",
    olvidados: "Not trained in 14+ days",
    sesionesRecientes: "Recent sessions",
    sinSesiones: "No sessions yet.",
    rutinasTitulo: "Routines",
    ejercicios: (n: number) => `${n} ${n === 1 ? "exercise" : "exercises"}`,
    series: (n: number) => `${n} ${n === 1 ? "set" : "sets"}`,
    sinRutinas: "This user doesn't have any routines yet.",
    nuevaRutina: "New routine",
    nombrePlaceholder: "Name (e.g. Push Day, Legs)",
    crearRutina: "Create routine",
  },

  // Sesión de un socio vista por el coach
  sesion: {
    soloLectura: "Coach view · read only",
    notasDelSocio: "Member's notes",
  },

  // Retos (crear y borrar)
  retos: {
    titulo: "Challenges",
    subtitulo: "Everyone who shows up in the leaderboard takes part",
    nuevo: "New challenge",
    nombre: "Name",
    nombrePlaceholder: "E.g. No-skip October",
    metrica: "What counts",
    meta: "Goal per person (optional)",
    metaAyuda: "Load in kg and swimming in meters. Without a goal, whoever scores the most wins.",
    desde: "From",
    hasta: "To",
    crear: "Create challenge",
    todos: "All challenges",
    sinRetos: "No challenges yet.",
    borrar: "Delete challenge",
    activo: "Active",
    proximo: "Upcoming",
    terminado: "Finished",
    errorFechas: "The end date can't be before the start date.",
  },

  // Botón de copiado de gifs
  espejo: {
    todoCopiado: "All of your exercises already have their own copy.",
    copiando: (faltan: number) => `Copying… ${faltan} left`,
    listo: (copiados: number) => `Done: ${copiados} copied`,
    copiar: (n: number) => `Copy ${n} ${n === 1 ? "gif" : "gifs"} to your storage`,
    sinBlob: "Vercel Blob isn't set up in this environment.",
    descargaFallida: "Some gifs couldn't be downloaded; try again later.",
    sinConexion: "Connection lost; please try again.",
  },

  // Diagnóstico del respaldo
  diagnostico: {
    revisando: "Checking…",
    boton: "Diagnose gif backup",
    token: "Blob token",
    acceso: "Token access",
    claves: "BLOB* keys seen",
    descarga: "Download gif",
    subida: "Upload to Blob",
    conCopia: "Gifs with a copy",
    pendientes: "Your pending ones",
    presente: "present",
    ausente: "MISSING",
  },
};
