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

## ✅ Concluído — Fase 2 (Núcleo de IA: Create)
- `src/lib/ai/`: `schema.ts` (Prompt IR + IntentAnalysis + ScoreResult, zod),
  `llm.ts` (clientes Haiku + Groq, `callHaikuJson` com retry), `prompts.ts`
  (prompts internos versionados, `PROMPT_VERSION`), `render.ts` (IR→texto;
  genérico / Claude-XML / **IMAGE** = prompt de modelo de imagem + negative),
  `engine.ts` (`analyzeIntent` → `synthesizePrompt` → `scorePrompt`).
- Motor **consciente do tipo de tarefa** — IMAGE gera prompt no formato certo
  (Midjourney/DALL·E), não instrução pra LLM de texto.
- Rota `POST /api/cotor` (session-gated): analisa → se falta info devolve
  perguntas, senão sintetiza + pontua e persiste (Prompt + PromptVersion + Score
  + ClarificationSession + UsageEvent).
- UI `/app`: composer (intenção → perguntas → resultado), `PromptResult`
  (prompt + botão copiar + estrutura do IR), `ScoreCard` (10 dimensões + veredito
  + por que essa nota / o que melhorar).
- **Testado end-to-end com as chaves reais** (`.dev/test-engine.ts`): imagem e
  texto. Score coerente (imagem 91→ após ajuste; ata de reunião 82/B).
- Motor roda **só no Haiku** por ora (síntese + judge). Groq já plugado
  (`callGroq`) — é a alavanca de custo/velocidade pra Fase 5.
- ⚠️ Latência: full run ~40–50s (score ~29s é o gargalo). `maxDuration=60` na
  rota. Otimizar depois (Groq no judge / streaming / menos tokens).

## ✅ Google OAuth — FEITO e testado
- Projeto Google Cloud `cotor-ia` · consentimento Externo (modo Teste) · client
  Web `cotor-ia-local` · redirect `http://localhost:3000/api/auth/callback/google`
  · usuário de teste = e-mail do Marcelo. Credenciais no `.env`.
- **Fix necessário:** Better Auth 1.7 exige coluna `issuer` no `Account`
  (identidade escopada por issuer) — sem ela o callback dava
  `internal_server_error`. Adicionada + `db push`.
- **Testado end-to-end pela UI**: `/entrar → Google → /app` → intenção → 4
  perguntas → "Montar o prompt" → prompt de imagem + Score 78/B. Persistência
  confirmada no Neon (1 user, 1 prompt, 1 version, 1 score, 1 clarification).

## 🚧 Em progresso / próximo
- **Fase 3 — Prompt Score UI + Optimize:** subir a UI do score pra nível produto
  (gauge-mira reutilizável do landing no `/app`), self-consistency (pontuar 3×
  mediana), botão "Otimizar prompt" → v2 (lineage já no schema).
- **Fase 4 — Organize + Reuse:** biblioteca, histórico de versões (o schema já
  suporta lineage), botão "Otimizar prompt" (loop de reescrita → v2).

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
| 2 | Núcleo de IA — Create (Prompt IR, pipeline, /app) | ✅ |
| 3 | Prompt Score UI nível produto + Optimize (loop v2) | ⬜ |
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
