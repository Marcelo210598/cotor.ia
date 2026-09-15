import type { NextConfig } from "next";

// script-src precisa de 'unsafe-inline': o App Router hidrata via <script>
// inline (self.__next_f.push(...)) sem type — bloquear isso quebra a página.
// Fechar isso direito exige nonce por request (middleware/proxy.ts), que o
// projeto não tem hoje. O resto da CSP (frame-ancestors, connect-src etc.)
// já fecha a maior parte da superfície (clickjacking, carregar script/host
// externo, exfiltração via fetch se algum XSS colar).
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // a home do usuário (dev local) é um repo git com lockfile próprio; fixa a raiz
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
};

export default nextConfig;
