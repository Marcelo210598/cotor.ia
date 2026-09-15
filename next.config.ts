import type { NextConfig } from "next";

// script-src com 'unsafe-inline' — DECISÃO CONSCIENTE (não pendência
// esquecida). Fechar isso direito exige nonce por request (proxy.ts), mas a
// doc do Next é clara: nonce obriga TODA página a renderizar dinamicamente —
// mata a estática/ISR da landing, sitemap, OG image e /p/[id] (Fase 6, feito
// de propósito pra SEO/perf). Sem XSS conhecido hoje pra esse fechamento
// proteger; reavaliar se algum dia entrar HTML dinâmico de usuário/LLM na
// página (dangerouslySetInnerHTML, markdown renderer etc.). O resto da CSP
// (frame-ancestors, connect-src, style/img/font-src) já fecha a maior parte
// da superfície: clickjacking, script/host externo, exfiltração via fetch.
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
