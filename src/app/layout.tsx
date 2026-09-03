import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Workout",
  description: "Lleva tus rutinas, pesos y repeticiones desde el celular.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Workout",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ebe7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#131220" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${outfit.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <main className="mx-auto w-full max-w-md flex-1 px-5 pb-28 pt-5">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
