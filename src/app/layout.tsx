import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import { Connectivity } from "@/components/Connectivity";
import { themeScript } from "@/lib/theme-script";
import { getDict, getLocale } from "@/i18n";
import { I18nProvider } from "@/i18n/client";
import "./globals.css";

// SF Pro está licenciada sólo para plataformas Apple; Inter es la sustituta
// con métricas más cercanas (ver docs/diseno-apple-fitness.md §4.2).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// "FiTME" es el nombre de la app (antes "Workout"): no se traduce. La
// descripción sí, porque es la que se ve al compartir el enlace y en los
// resultados de búsqueda.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return {
    title: "FiTME",
    description: t.comun.meta.descripcion,
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "FiTME",
    },
    icons: {
      icon: [
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    },
  };
}

// El `theme-color` lo maneja `themeScript`: con tema forzado desde Perfil, un
// meta por media query diría lo contrario a lo que se ve en pantalla.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <I18nProvider locale={locale}>
          <Connectivity />
          <main className="mx-auto w-full max-w-md flex-1 px-5 pb-32 pt-4">
            {children}
          </main>
          <BottomNav />
        </I18nProvider>
      </body>
    </html>
  );
}
