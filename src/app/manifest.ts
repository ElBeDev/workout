import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Workout",
    short_name: "Workout",
    description: "Lleva tus rutinas, pesos y repeticiones desde el celular.",
    start_url: "/",
    display: "standalone",
    // El manifest no admite variantes claro/oscuro (a diferencia del
    // <meta theme-color> del <head>, que sí cambia con el tema): aquí sólo
    // hay una oportunidad de acertar. Negro porque es el modo "nativo" del
    // rediseño (docs/diseno-apple-fitness.md) y el que ve quien no ha
    // elegido nada en Perfil con el sistema en oscuro.
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
