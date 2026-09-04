import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Custom-exercise photos go through a server action → Vercel Blob.
      // Vercel caps server uploads at 4.5 MB; Next's default is 1 MB.
      bodySizeLimit: "4.5mb",
    },
  },
};

export default nextConfig;
