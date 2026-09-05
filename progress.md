# COTOR.IA — Progresso

## Última atualização: 2026-09-05

## 📌 Visão Geral
**COTOR.IA = copiloto de engenharia de prompts.** Você diz a intenção crua, o
COTOR identifica o objetivo, cobre lacunas (perguntando antes de inventar), monta
a estrutura profissional (Prompt IR), pontua com rubrica técnica de 10 dimensões
e otimiza em loop. Não ensina a escrever prompt — faz a engenharia pelo usuário.

- **Mercado:** BR-first (PT-BR), arquitetura i18n-ready pra escalar global.
- **Stack:** Next.js 16 (App Router) · React 19 · TS · Tailwind v4 · shadcn/ui
  (base-nova / Base UI) · Prisma 6 + Neon Postgres · Better Auth (só Google OAuth)
  · Groq (qwen3) + Claude Haiku 4.5 como motor · Asaas (pagamento, Fase 5).
- **Deploy:** Vercel via `vercel deploy --prod` (Fase 6).
- **Repo:** github.com/Marcelo210598/cotor.ia
- **Marca:** near-black #0B0B0B · coral #FF5A5F · off-white #F5F5F5. Mono (JetBrains
  Mono) como display — o produto é texto monospace. Signature: gauge de score em
  formato de mira (eco da logo).

## ✅ Concluído — Fase 1 (Fundação)
- Scaffold Next 16 + Tailwind v4 + shadcn (base-nova).
- Tema único dark com tokens da marca (`globals.css`).
- Landing completa: hero com transformação antes→depois animada, seção Prompt
  Score (gauge-mira + barras por dimensão + "por que essa nota / o que melhorar"),
  pipeline de 5 passos, faixa dos 5 pilares, pricing (Free/Pro/Team), CTA.
- Página `/entrar` (split-screen, botão Google).
- Prisma schema completo (User/Session/Account + Subscription + Project + Prompt +
  PromptVersion + ClarificationSession + Score + UsageEvent) — **já sincronizado
  no Neon** (`prisma db push`).
- Better Auth wired (`src/lib/auth.ts`, rota `/api/auth/[...all]`, client).
- `.env` com Neon + Groq + Haiku. `.env` fora do git.

## 🚧 Em progresso / próximo
- **Google OAuth:** criar client no Google Cloud (Marcelo + Claude juntos),
  redirect `http://localhost:3000/api/auth/callback/google`. Sem isso o login
  não funciona.
- **Fase 2 — Núcleo de IA:** Prompt IR + pipeline (intent → gap analysis →
  clarification → synthesis → render) + integração Groq/Haiku + prompts internos
  versionados no repo.

## ⚠️ Decisões / armadilhas
- **Prisma 7** tem breaking change (sem `url` no schema, exige `prisma.config.ts`
  + driver adapter). Fixado em **Prisma 6.19.3** (estável) — não subir sem migrar.
- **shadcn base-nova usa Base UI**, não Radix → **não tem `asChild`**. Usar
  `<LinkButton>` (`src/components/ui/link-button.tsx`) ou o prop `render` do Base UI.
- Next 16: `middleware.ts` virou `proxy.ts`. `next build` não roda mais lint.
- `AGENTS.md` na raiz é regravado pelo `next dev` — commitar junto.
- npm cache do ambiente dá EACCES no sandbox → `npm_config_cache=$PWD/.npmcache`
  (ignorado no git).

## 📋 Roadmap
| Fase | Escopo | Status |
|---|---|---|
| 1 | Fundação (scaffold, tema, landing, auth, db) | ✅ |
| 2 | Núcleo de IA — Create + Optimize (Prompt IR, pipeline) | ⬜ |
| 3 | Prompt Score (rubrica híbrida, UI do score) | ⬜ |
| 4 | Organize + Reuse (biblioteca, versões, templates) | ⬜ |
| 5 | Test (Playground) + Billing (Asaas) + rate limit | ⬜ |
| 6 | Deploy (domínio, Vercel, SEO, página pública de prompt) | ⬜ |

## 🔧 Rodar local
```bash
npm install
cp .env.example .env   # preencher DATABASE_URL, GOOGLE_*, GROQ_API_KEY, ANTHROPIC_API_KEY, BETTER_AUTH_SECRET
npm run db:generate
npm run dev             # http://localhost:3000
```
