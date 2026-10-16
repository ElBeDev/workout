/** Alumno ↔ coach: liga para unirse, "Mi coach", alta de coach, invitar y copiar rutinas (docs/coaches.md §4). */
export const vinculos = {
  // Notificaciones push (las manda el servidor; van en español, como el
  // recordatorio, porque el idioma vive en una cookie del teléfono)
  avisos: {
    nuevoAlumnoTitulo: "Alumno nuevo",
    nuevoAlumno: (alumno: string) => `${alumno} se unió a tu grupo.`,
    seFueTitulo: "Un alumno se fue",
    seFue: (alumno: string) => `${alumno} ya no entrena contigo.`,
    sinCupoTitulo: "Llegaste al tope de tu plan",
    sinCupo: (alumno: string) => `${alumno} quiso unirse, pero tu plan ya está lleno.`,
    solicitudTitulo: "Quieren entrenar contigo",
    solicitud: (alumno: string) => `${alumno} te pidió unirse a tu grupo.`,
    aceptadoTitulo: "Ya tienes coach",
    aceptado: (coach: string) => `${coach} aceptó tu solicitud.`,
    rechazadoTitulo: "Solicitud no aceptada",
    rechazado: (coach: string) => `${coach} no aceptó tu solicitud.`,
    teQuitoTitulo: "Ya no estás en un grupo",
    teQuito: (coach: string) => `${coach} te quitó de su grupo. Tu historial sigue siendo tuyo.`,
  },

  /** Por qué no se pudo unir o pedir unirse. */
  errores: {
    no_existe: "No encontramos a ese coach. Revisa el código o el usuario.",
    eres_tu: "Ese eres tú.",
    es_coach: "Una cuenta de coach no se puede unir a otro coach.",
    ya_es_tu_coach: "Ya entrenas con ese coach.",
    tiene_otro: "Ya tienes coach. Para cambiar, usa la liga o el código del nuevo.",
    sin_cupo: "Ese coach llegó al tope de su plan. Avísale para que te haga lugar.",
    ya_pendiente: "Ya tienes una solicitud esperando respuesta.",
  } as Record<string, string>,

  // La liga /unirse/[code]
  unirse: {
    titulo: "Entrena con",
    subtitulo: "Tu coach te arma las rutinas, ve cómo vas y compites con su grupo.",
    crearCuenta: "Crear cuenta",
    yaTengoCuenta: "Ya tengo cuenta",
    entrenarCon: (coach: string) => `Entrenar con ${coach}`,
    cambiarA: (coach: string) => `Cambiar a ${coach}`,
    yaEntrenasCon: (actual: string, nuevo: string) =>
      `Ya entrenas con ${actual}. Si cambias a ${nuevo}, ${actual} deja de ver tus entrenamientos. Tu historial sigue siendo tuyo.`,
    noExiste: "Esta liga ya no sirve. Pídele a tu coach que te la mande otra vez.",
    irAHoy: "Ir a Hoy",
    alumnos: (n: number) => `${n} ${n === 1 ? "alumno" : "alumnos"}`,
  },

  // Perfil → Mi coach
  miCoach: {
    titulo: "Mi coach",
    sinCoach: "Entrenas por tu cuenta. Únete a tu coach con su código, o pídele unirte con su usuario.",
    codigo: "Código del coach",
    codigoPlaceholder: "GL-XXXX",
    unirme: "Unirme",
    usuario: "O su usuario",
    usuarioPlaceholder: "usuario del coach",
    pedir: "Pedir unirme",
    pendiente: (coach: string) => `Le pediste a ${coach} unirte a su grupo. Falta que acepte.`,
    cancelar: "Cancelar solicitud",
    desde: (fecha: string) => `Desde el ${fecha}`,
    dejar: "Dejar a mi coach",
    confirmarDejar: "Tu coach deja de ver tus entrenamientos y sales del ranking de su grupo. Tu historial, rutinas y XP siguen siendo tuyos.",
    siDejar: "Sí, dejarlo",
    eresCoach: "¿Eres coach?",
    hazteCoach: "Crea tu grupo",
    unido: (coach: string) => `Listo: ahora entrenas con ${coach}.`,
    enviada: (coach: string) => `Le mandamos tu solicitud a ${coach}.`,
  },

  // Alta de coach: /registro/coach
  registroCoach: {
    titulo: "Soy coach",
    subtitulo: "Arma rutinas para tus alumnos, ve cómo van y ponlos a competir.",
    subtituloConCuenta: "Tu cuenta se vuelve de coach: conservas tu historial y tus rutinas.",
    usuario: "Usuario",
    contrasena: "Contraseña",
    nombre: "Tu nombre",
    nombrePlaceholder: "Como te ven tus alumnos",
    marca: "Nombre de tu marca (opcional)",
    marcaPlaceholder: "Ej. Entrena con Ana",
    crear: "Crear cuenta de coach",
    convertir: "Volverme coach",
    prueba: "14 días de prueba. Después, $199 al mes con todo incluido.",
    errores: {
      invalid: "Usuario de 3 a 40 caracteres (letras, números, . _ @ -) y contraseña de 4 a 128.",
      taken: "Ese usuario ya existe. Elige otro.",
      ya_es_coach: "Tu cuenta ya es de coach.",
      tiene_coach: "Primero deja a tu coach (Perfil → Mi coach): un coach no tiene coach.",
    } as Record<string, string>,
    soyCoach: "Soy coach",
  },

  // Panel del coach
  panel: {
    invitarTitulo: "Invita a tus alumnos",
    invitarAyuda: "Mándales la liga o enséñales el QR: al abrirla quedan en tu grupo.",
    tuCodigo: "Tu código",
    copiarLiga: "Copiar liga",
    copiada: "Copiada",
    whatsapp: "WhatsApp",
    mensajeWhatsapp: (coach: string, liga: string) => `Entrena conmigo en GainLine. Únete a mi grupo aquí: ${liga} (${coach})`,
    cupo: (n: number, tope: number | null) =>
      tope === null ? `${n} ${n === 1 ? "alumno" : "alumnos"}` : `${n} de ${tope} alumnos`,
    qrAlt: "QR con la liga para unirse",
    solicitudesTitulo: "Quieren entrenar contigo",
    aceptar: "Aceptar",
    rechazar: "Rechazar",
    sinCupo: "Llegaste al tope de tu plan: no puedes aceptar a nadie más.",
    sinAlumnos: "Todavía no tienes alumnos. Comparte tu liga para empezar.",
    quitar: "Quitar de mi grupo",
    confirmarQuitar: "Deja de estar en tu grupo y dejas de ver sus entrenamientos. Su historial sigue siendo suyo.",
    siQuitar: "Sí, quitar",
  },

  // Copiar una rutina a varios alumnos
  copiar: {
    boton: "Copiar a alumnos",
    titulo: "Copiar rutina",
    subtitulo: (rutina: string) => `"${rutina}" se copia como rutina nueva en cada alumno que elijas.`,
    copiar: "Copiar",
    sinAlumnos: "Todavía no tienes alumnos a quién copiarla.",
    ninguno: "Elige al menos un alumno.",
    listo: (n: number) => `Copiada a ${n} ${n === 1 ? "alumno" : "alumnos"}.`,
  },
};
