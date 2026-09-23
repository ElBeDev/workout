/** Perfil: apariencia, sonido, idioma, metas, peso corporal, contraseña. */
export const perfil = {
  titulo: "Perfil",
  /** `fecha` ya viene formateada por `fmtDate` (mes y año). */
  miembroDesde: (fecha: string) => `Desde ${fecha}`,

  idioma: {
    titulo: "Idioma",
    // Los idiomas se nombran en su propio idioma: no se traducen.
    espanol: "Español",
    ingles: "English",
  },

  apariencia: {
    titulo: "Apariencia y sonido",
    sistema: "Sistema",
    claro: "Claro",
    oscuro: "Oscuro",
  },

  sonido: {
    titulo: "Sonido al terminar el descanso",
    descripcion: "Tres pitidos cortos. No suena con el teléfono bloqueado.",
  },

  metas: {
    titulo: "Metas de la semana",
    explicacion:
      "Son las tres metas de los anillos del Resumen. La carga no cuenta los ejercicios en placas (no hay forma de convertirlas a kilos).",
    carga: "Carga (kg)",
    series: "Series",
    dias: "Días",
    guardar: "Guardar metas",
  },

  admin: {
    titulo: "Panel de administrador",
    descripcion: "Armar rutinas para cualquier usuario",
  },

  peso: {
    titulo: "Peso corporal",
    ultimoRegistro: "Último registro",
    desdeElPrimero: "Desde el primero",
    kg: "kg",
    enKg: (peso: number) => `${peso} kg`,
    placeholder: "Peso de hoy (kg)",
    guardar: "Guardar peso",
    borrar: "Borrar registro",
    /** Leyenda de la gráfica (tooltip de recharts). */
    serie: "Peso",
  },

  contrasena: {
    titulo: "Cambiar contraseña",
    actualizada: "Contraseña actualizada.",
    actual: "Contraseña actual",
    nueva: "Nueva contraseña",
    repetir: "Repite la nueva",
    actualizar: "Actualizar contraseña",
    aviso:
      "No pedimos correo, así que no hay forma de recuperar la contraseña si la olvidas. Guárdala en un lugar seguro.",
    errores: {
      short: "La contraseña nueva debe tener al menos 4 caracteres.",
      mismatch: "Las contraseñas nuevas no coinciden.",
      wrong: "La contraseña actual no es correcta.",
    },
  },

  exportar: "Exportar historial (CSV)",
  cerrarSesion: "Cerrar sesión",
};
