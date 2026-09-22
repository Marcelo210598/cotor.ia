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
  // MESMO problema, mas pro tracing de produção: sem isso o Next pode subir a
  // árvore procurando lockfile e achar o package-lock.json da HOME do usuário
  // como "monorepo root" — mantém o tracing restrito à pasta do projeto.
  outputFileTracingRoot: process.cwd(),
  // Achado em 22/09: Functions Storage do time na Vercel estourou o limite do
  // Hobby (9,89GB/10GB, ~3,3GB por deployment) — quase tudo vindo do @prisma/client
  // empacotando o engine de TODOS os provedores de banco (mysql/sqlserver/sqlite/
  // cockroachdb + o binário nativo darwin de dev) em CADA rota, mesmo o projeto
  // usando só postgresql (Neon), + o pacote `sharp` (usado só pela otimização de
  // imagem self-hosted; a Vercel tem infra própria de Image Optimization e não
  // precisa dele bundlado nas funções). Medido: caiu de 2,43GB pra ~110MB no build
  // local (soma de todas as rotas). Ver historico/2026-09-22.md.
  outputFileTracingExcludes: {
    "/*": [
      "./node_modules/@prisma/client/runtime/*mysql*",
      "./node_modules/@prisma/client/runtime/*sqlserver*",
      "./node_modules/@prisma/client/runtime/*cockroachdb*",
      "./node_modules/@prisma/client/runtime/*sqlite*",
      "./node_modules/.prisma/client/*darwin*",
      "./node_modules/@prisma/engines/*darwin*",
      "./node_modules/@img/**",
    ],
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
