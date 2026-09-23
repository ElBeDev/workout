/** Panel de administrador y mantenimiento. */
export const admin = {
  // Listado de usuarios
  titulo: "Administrador",
  subtitulo: "Elige un usuario para armarle rutinas",
  usuarios: "Usuarios",
  sinUsuario: "Sin usuario",
  tu: "tú",
  rutinas: (n: number) => `${n} ${n === 1 ? "rutina" : "rutinas"}`,

  // Mantenimiento (respaldo de gifs)
  mantenimiento: "Mantenimiento",
  respaldoExplicacion:
    "Respaldo de los gifs del catálogo en nuestro propio almacenamiento. Los ejercicios nuevos se copian solos al agregarlos; el botón alcanza a los viejos. El diagnóstico dice cuál pieza falla cuando no copia nada.",
  respaldoSinToken: "Sin BLOB_READ_WRITE_TOKEN en este entorno: el respaldo no corre.",

  // Detalle de un usuario
  usuario: {
    tituloSinNombre: "Usuario",
    subtitulo: "Rutinas de este usuario",
    ejercicios: (n: number) => `${n} ${n === 1 ? "ejercicio" : "ejercicios"}`,
    series: (n: number) => `${n} ${n === 1 ? "serie" : "series"}`,
    sinRutinas: "Este usuario todavía no tiene rutinas.",
    nuevaRutina: "Nueva rutina",
    nombrePlaceholder: "Nombre (ej. Push Day, Pierna)",
    crearRutina: "Crear rutina",
  },

  // Botón de copiado de gifs
  espejo: {
    todoCopiado: "Todos tus ejercicios ya tienen copia propia.",
    copiando: (faltan: number) => `Copiando… faltan ${faltan}`,
    listo: (copiados: number) => `Listo: ${copiados} copiados`,
    copiar: (n: number) => `Copiar ${n} ${n === 1 ? "gif" : "gifs"} a tu almacenamiento`,
    sinBlob: "Vercel Blob no está configurado en este entorno.",
    descargaFallida: "Algunos gifs no se pudieron descargar; inténtalo más tarde.",
    sinConexion: "Se perdió la conexión; vuelve a intentar.",
  },

  // Diagnóstico del respaldo
  diagnostico: {
    revisando: "Revisando…",
    boton: "Diagnosticar respaldo de gifs",
    token: "Token de Blob",
    acceso: "Acceso al token",
    claves: "Claves BLOB* vistas",
    descarga: "Descargar gif",
    subida: "Subir a Blob",
    conCopia: "Gifs con copia",
    pendientes: "Pendientes tuyos",
    presente: "presente",
    ausente: "AUSENTE",
  },
};
