import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // a home do usuário é um repo git com lockfile próprio; fixa a raiz aqui
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
