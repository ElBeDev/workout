import type { admin as Es } from "../es/admin";

/** Panel de administrador y mantenimiento. */
export const admin: typeof Es = {
  // Listado de usuarios
  titulo: "Admin",
  subtitulo: "Pick a user to build routines for",
  usuarios: "Users",
  sinUsuario: "No username",
  tu: "you",
  rutinas: (n: number) => `${n} ${n === 1 ? "routine" : "routines"}`,

  // Mantenimiento (respaldo de gifs)
  mantenimiento: "Maintenance",
  respaldoExplicacion:
    "Backup of the catalog gifs on our own storage. New exercises are copied automatically when you add them; the button catches up on the old ones. The diagnostics tell you which piece is failing when nothing gets copied.",
  respaldoSinToken: "No BLOB_READ_WRITE_TOKEN in this environment: the backup won't run.",

  // Detalle de un usuario
  usuario: {
    tituloSinNombre: "User",
    subtitulo: "This user's routines",
    ejercicios: (n: number) => `${n} ${n === 1 ? "exercise" : "exercises"}`,
    series: (n: number) => `${n} ${n === 1 ? "set" : "sets"}`,
    sinRutinas: "This user doesn't have any routines yet.",
    nuevaRutina: "New routine",
    nombrePlaceholder: "Name (e.g. Push Day, Legs)",
    crearRutina: "Create routine",
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
