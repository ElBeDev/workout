/** Páginas públicas, sin sesión: la de coaches y el pie de los legales (docs/coaches.md §8.2). */
export const publico = {
  coaches: {
    etiqueta: "GainLine para coaches",
    titulo: "Tus alumnos, sus rutinas y su progreso, en una app.",
    subtitulo: "Armas la rutina una vez, ellos la entrenan desde el celular y tú ves quién viene y quién no.",
    precio: (pesos: number) => `$${pesos} al mes, todo incluido`,
    precioNota: "Te cuesta menos de lo que te paga un solo alumno.",
    cta: "Prueba 14 días",
    yaTengoCuenta: "Ya tengo cuenta",

    queHace: "Qué hace",
    funciones: [
      {
        titulo: "Rutinas que se reparten solas",
        texto: "Arma una rutina y cópiala a todos tus alumnos de una vez. Les llega marcada como «De tu coach».",
      },
      {
        titulo: "Quién no ha venido",
        texto: "Tu panel pone arriba, en rojo, a quien lleva 10 días sin entrenar, para que vayas por él antes de que se te vaya.",
      },
      {
        titulo: "Comentarios con notificación",
        texto: "Escríbele sobre una sesión o en general; le llega al celular y lo ve al abrir la app.",
      },
      {
        titulo: "Ranking y retos de tu grupo",
        texto: "Tus alumnos compiten por XP, días, carga o series, con retos que tú armas, rangos y medallas.",
      },
      {
        titulo: "Invita con una liga",
        texto: "Comparte tu liga o tu QR por WhatsApp: al abrirla quedan en tu grupo, con o sin cuenta.",
      },
      {
        titulo: "Pesas, cardio y natación",
        texto: "Kilos, libras o placas, cardio por minutos y rutinas de natación por bloques.",
      },
    ],

    comoFunciona: "Cómo funciona",
    pasos: ["Crea tu cuenta de coach.", "Comparte tu liga con tus alumnos.", "Ármales la rutina y ve cómo van."],

    precios: "Precio",
    planCoach: "Coach",
    planCoachDetalle: (alumnos: number) => `Hasta ${alumnos} alumnos`,
    planPlus: "Más de 30 alumnos",
    planPlusDetalle: "Sin tope de alumnos",
    alMes: "al mes",
    incluye: "Todo incluido: panel, rutinas, comentarios, retos y ranking. Tus alumnos no pagan.",
    anual: (pesos: string) => `O ${pesos} al año: dos meses gratis.`,
    prueba: (dias: number) => `${dias} días de prueba. Precios en pesos, con IVA.`,

    preguntas: "Preguntas",
    faq: [
      { p: "¿Mis alumnos pagan?", r: "No. Ellos usan la app gratis; el que paga es el coach." },
      {
        p: "¿Qué pasa si dejo de pagar?",
        r: "Tu panel se bloquea, pero tus alumnos siguen entrenando con las rutinas que ya tienen.",
      },
      {
        p: "¿De quién son los datos?",
        r: "Del alumno. Tú los ves mientras entrena contigo; si se cambia de coach, se lleva su historial.",
      },
      {
        p: "¿Funciona en iPhone y Android?",
        r: "Sí. Se abre en el navegador y se instala en la pantalla de inicio, en los dos.",
      },
    ],
  },

  legal: {
    terminos: "Términos",
    privacidad: "Aviso de privacidad",
    borrador: "Borrador: faltan los datos del responsable y la revisión de un abogado.",
    actualizado: (fecha: string) => `Última actualización: ${fecha}`,
    soloEspanol: "",
    aceptas: "Al crear tu cuenta aceptas los",
    y: "y el",
  },
};
