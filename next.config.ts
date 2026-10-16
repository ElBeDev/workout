import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El panel del coach vivía en /admin hasta la Decimoséptima; /admin quedó
  // para el dueño de la plataforma (docs/coaches.md §6 y §8).
  async redirects() {
    return [
      { source: "/admin/usuarios/:path*", destination: "/coach/usuarios/:path*", permanent: true },
      { source: "/admin/retos", destination: "/coach/retos", permanent: true },
    ];
  },
  experimental: {
    serverActions: {
      // Custom-exercise photos go through a server action → Vercel Blob.
      // Vercel caps server uploads at 4.5 MB; Next's default is 1 MB.
      bodySizeLimit: "4.5mb",
    },
  },
};

export default nextConfig;
