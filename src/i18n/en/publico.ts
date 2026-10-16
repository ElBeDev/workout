import type { publico as Es } from "../es/publico";

/** Public pages, no session: the coaches page and the legal footer. */
export const publico: typeof Es = {
  coaches: {
    etiqueta: "GainLine for coaches",
    titulo: "Your members, their routines and their progress, in one app.",
    subtitulo: "Build the routine once, they train it from their phone, and you see who shows up and who doesn't.",
    precio: (pesos) => `$${pesos} MXN a month, everything included`,
    precioNota: "It costs you less than what a single member pays you.",
    cta: "Try it for 14 days",
    yaTengoCuenta: "I have an account",

    queHace: "What it does",
    funciones: [
      {
        titulo: "Routines that hand themselves out",
        texto: "Build a routine and copy it to all your members at once. It shows up marked “From your coach”.",
      },
      {
        titulo: "Who hasn't come",
        texto: "Your panel puts anyone who hasn't trained in 10 days at the top, in red, so you reach out before you lose them.",
      },
      {
        titulo: "Comments with notifications",
        texto: "Write about a session or in general; it reaches their phone and they see it when they open the app.",
      },
      {
        titulo: "Your group's ranking and challenges",
        texto: "Your members compete on XP, days, load or sets, with challenges you set up, ranks and medals.",
      },
      {
        titulo: "Invite with a link",
        texto: "Share your link or QR on WhatsApp: opening it puts them in your group, with or without an account.",
      },
      {
        titulo: "Weights, cardio and swimming",
        texto: "Kilos, pounds or plates, cardio by minutes, and swim routines in blocks.",
      },
    ],

    comoFunciona: "How it works",
    pasos: ["Create your coach account.", "Share your link with your members.", "Build their routine and follow their progress."],

    precios: "Pricing",
    planCoach: "Coach",
    planCoachDetalle: (alumnos) => `Up to ${alumnos} members`,
    planPlus: "Over 30 members",
    planPlusDetalle: "No member limit",
    alMes: "a month",
    incluye: "Everything included: panel, routines, comments, challenges and ranking. Your members don't pay.",
    anual: (pesos) => `Or ${pesos} a year: two months free.`,
    prueba: (dias) => `${dias}-day trial. Prices in Mexican pesos, VAT included.`,

    preguntas: "Questions",
    faq: [
      { p: "Do my members pay?", r: "No. They use the app for free; the coach is the one who pays." },
      {
        p: "What happens if I stop paying?",
        r: "Your panel gets locked, but your members keep training with the routines they already have.",
      },
      {
        p: "Who owns the data?",
        r: "The member. You see it while they train with you; if they switch coaches, they take their history with them.",
      },
      {
        p: "Does it work on iPhone and Android?",
        r: "Yes. It opens in the browser and installs to the home screen on both.",
      },
    ],
  },

  legal: {
    terminos: "Terms",
    privacidad: "Privacy notice",
    borrador: "Draft: the controller's details and a lawyer's review are still missing.",
    actualizado: (fecha) => `Last updated: ${fecha}`,
    soloEspanol: "These documents are governed by Mexican law and are only available in Spanish.",
    aceptas: "By creating your account you accept the",
    y: "and the",
  },
};
