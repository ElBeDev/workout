import type { perfil as Es } from "../es/perfil";

/** Perfil: apariencia, sonido, idioma, metas, peso corporal, contraseña. */
export const perfil: typeof Es = {
  recordatorio: {
    titulo: "Workout reminder",
    ayuda: "A nudge on the days a routine is scheduled. On iPhone the app must be installed to the home screen.",
    cuando: "We'll nudge you at 7 pm.",
    probar: "Test",
    listo: "All set — we'll remind you on training days.",
    fallo: "Couldn't turn it on. Try again.",
    permisoDenegado: "Notifications are blocked. Turn them on in your phone's settings.",
    noSoportado: "This browser doesn't support notifications. On iPhone, install the app to your home screen.",
    pruebaEnviada: "Test notification sent.",
    pruebaFallo: "Couldn't send the test notification.",
  },

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
