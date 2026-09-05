import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // a home do usuário (dev local) é um repo git com lockfile próprio; fixa a raiz
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
