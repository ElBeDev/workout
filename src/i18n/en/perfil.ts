import type { perfil as Es } from "../es/perfil";

/** Perfil: apariencia, sonido, idioma, metas, peso corporal, contraseña. */
export const perfil: typeof Es = {
  titulo: "Profile",
  miembroDesde: (fecha: string) => `Since ${fecha}`,

  idioma: {
    titulo: "Language",
    espanol: "Español",
    ingles: "English",
  },

  apariencia: {
    titulo: "Appearance & sound",
    sistema: "System",
    claro: "Light",
    oscuro: "Dark",
  },

  sonido: {
    titulo: "Sound when rest ends",
    descripcion: "Three short beeps. Won't play while your phone is locked.",
  },

  metas: {
    titulo: "Weekly goals",
    explicacion:
      "These are the three goals behind the rings on Today. Load skips exercises logged in plates (there's no way to convert those to kilograms).",
    carga: "Load (kg)",
    series: "Sets",
    dias: "Days",
    guardar: "Save goals",
  },

  admin: {
    titulo: "Admin panel",
    descripcion: "Build routines for any user",
  },

  peso: {
    titulo: "Body weight",
    ultimoRegistro: "Latest weigh-in",
    desdeElPrimero: "Since the first",
    kg: "kg",
    enKg: (peso: number) => `${peso} kg`,
    placeholder: "Today's weight (kg)",
    guardar: "Save weight",
    borrar: "Delete entry",
    serie: "Weight",
  },

  contrasena: {
    titulo: "Change password",
    actualizada: "Password updated.",
    actual: "Current password",
    nueva: "New password",
    repetir: "Repeat new password",
    actualizar: "Update password",
    aviso:
      "We don't ask for an email, so there's no way to recover your password if you forget it. Keep it somewhere safe.",
    errores: {
      short: "Your new password must be at least 4 characters.",
      mismatch: "The new passwords don't match.",
      wrong: "That's not your current password.",
    },
  },

  exportar: "Export history (CSV)",
  cerrarSesion: "Log out",
};
