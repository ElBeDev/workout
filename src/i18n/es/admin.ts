/** Panel de administrador y mantenimiento. */
export const admin = {
  // Listado de usuarios
  titulo: "Coach",
  subtitulo: "Cómo va cada socio",
  usuarios: "Usuarios",
  sinUsuario: "Sin usuario",
  tu: "tú",
  rutinas: (n: number) => `${n} ${n === 1 ? "rutina" : "rutinas"}`,

  // Panel del coach
  requierenAtencion: (dias: number) => `Sin venir hace ${dias} días o más`,
  activos: "Activos",
  todosActivos: (dias: number) => `Nadie lleva ${dias} días sin venir.`,
  nuncaHaEntrenado: "Nunca ha entrenado",
  sinRutinas: "sin rutinas",
  resumen30: (dias: number, series: number) =>
    `${dias} ${dias === 1 ? "día" : "días"} · ${series} ${series === 1 ? "serie" : "series"} en 30 días`,
  retosTitulo: "Retos del gimnasio",
  retosDescripcion: "Crear y borrar retos para todos",

  // Mantenimiento (respaldo de gifs)
  mantenimiento: "Mantenimiento",
  respaldoExplicacion:
    "Respaldo de los gifs del catálogo en nuestro propio almacenamiento. Los ejercicios nuevos se copian solos al agregarlos; el botón alcanza a los viejos. El diagnóstico dice cuál pieza falla cuando no copia nada.",
  respaldoSinToken: "Sin BLOB_READ_WRITE_TOKEN en este entorno: el respaldo no corre.",

  // Detalle de un usuario
  usuario: {
    tituloSinNombre: "Usuario",
    subtitulo: "Rutinas de este usuario",
    ultimaActividad: "Última vez que entrenó",
    estaSemana: "Esta semana",
    ultimos30: "Últimos 30 días",
    olvidados: "Sin entrenar hace 14 días o más",
    sesionesRecientes: "Sesiones recientes",
    sinSesiones: "Todavía no tiene sesiones.",
    rutinasTitulo: "Rutinas",
    ejercicios: (n: number) => `${n} ${n === 1 ? "ejercicio" : "ejercicios"}`,
    series: (n: number) => `${n} ${n === 1 ? "serie" : "series"}`,
    sinRutinas: "Este usuario todavía no tiene rutinas.",
    nuevaRutina: "Nueva rutina",
    nombrePlaceholder: "Nombre (ej. Push Day, Pierna)",
    crearRutina: "Crear rutina",
  },

  // Sesión de un socio vista por el coach
  sesion: {
    soloLectura: "Vista del coach · sólo lectura",
    notasDelSocio: "Notas del socio",
  },

  // Retos (crear y borrar)
  retos: {
    titulo: "Retos",
    subtitulo: "Participan todos los que aparecen en el ranking",
    nuevo: "Nuevo reto",
    nombre: "Nombre",
    nombrePlaceholder: "Ej. Octubre sin faltar",
    metrica: "Qué se cuenta",
    meta: "Meta por persona (opcional)",
    metaAyuda: "Carga en kg y natación en metros. Sin meta, gana quien más sume.",
    desde: "Desde",
    hasta: "Hasta",
    crear: "Crear reto",
    todos: "Todos los retos",
    sinRetos: "Todavía no hay retos.",
    borrar: "Borrar reto",
    activo: "Activo",
    proximo: "Próximo",
    terminado: "Terminado",
    errorFechas: "La fecha de fin no puede ser antes de la de inicio.",
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
