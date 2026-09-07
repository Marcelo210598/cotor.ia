# COTOR.IA — Resumo geral

## O que é
Copiloto de engenharia de prompts. O usuário escreve a intenção crua ("quero um
prompt pra analisar meus trades"); o COTOR faz a engenharia: identifica objetivo,
pergunta o que falta, monta estrutura profissional (Prompt IR), pontua com rubrica
de 10 dimensões e otimiza em loop. **Faz pelo usuário, não ensina.**

Tagline / pilares: **Create · Optimize · Test · Organize · Reuse**.

## Stack
Next 16 · React 19 · TS · Tailwind v4 · shadcn (base-nova/Base UI) · Prisma 6 +
Neon · Better Auth (Google OAuth) · Groq (`gpt-oss-120b`) + Claude Haiku 4.5 ·
Upstash Redis (rate limit) · Asaas (billing, Fase 5c).

## Conceito-chave: Prompt IR
Objeto estruturado `{ persona, objetivo, contexto[], constraints[],
decomposicao[], formato_saida, exemplos[], criterios_sucesso[], guardrails[] }`.
Guardado como JSON em `PromptVersion.ir`. Renderers por modelo. É o que permite
multi-modelo, diff campo-a-campo e score consistente.

## Estado (fim do dia 07/09)
| Fase | O quê | Status |
|---|---|---|
| 1 | Fundação: scaffold, tema, landing, `/entrar`, auth, schema no Neon | ✅ |
| 2 | Núcleo de IA — Create (Prompt IR, pipeline `src/lib/ai/`, `/app`) | ✅ |
| 3 | Prompt Score UI + Optimize (loop v2, latência ~20s) | ✅ |
| 4 | Organize + Reuse (biblioteca `/app/prompts`, versões/diff/restore, templates `/app/templates` com `{{x}}` + templatize IA) | ✅ |
| 5a | Playground (`/api/playground` + `PlaygroundPanel`, roda o prompt num modelo real) | ✅ |
| 5b | Rate limit Upstash (429 por plano) — **ativo em prod** | ✅ |
| 5c | Billing Asaas — Starter R$19,90 + Pro R$39, Pix, `/app/conta`, webhook, cron de expiração | ✅ **EM PRODUÇÃO** |
| 6 | SEO + GEO + página pública de prompt (`/p/[id]`) | ✅ (sem domínio próprio por ora) |

**NO AR: https://cotor-ia.vercel.app** — login Google, rate limit, **billing Asaas
em produção** (`ASAAS_ENV=production`). Planos: Free 7/mês · Starter R$19,90
(50/mês) · Pro R$39 · Team. Fluxo pagamento→webhook→upgrade validado no sandbox.
Cron diário `billing-sweep` derruba pra FREE no fim do ciclo.

## Estado 07/09 (fim)
- **5c EM PRODUÇÃO e validada** — checkout Starter R$19,90 real → "receber em
  dinheiro" no Asaas prod → webhook → user STARTER. Marcelo tá STARTER (do teste).
- **Perf:** função movida pra `gru1` (SP, do lado do Neon) + cookieCache de
  sessão + `getSession()` deduplicado + `loading.tsx`. Navegação bem mais rápida.
- **Fase 6:** `robots.ts` · `sitemap.ts` (inclui prompts públicos) ·
  `opengraph-image.tsx` (marca) · JSON-LD (WebSite + SoftwareApplication +
  FAQPage) · seção FAQ na landing · `public/llms.txt` (GEO) · **página pública
  `/p/[id]`** (toggle "Compartilhar" no detalhe do prompt, OG por prompt com o
  score, CTA "fazer o meu").

## PRÓXIMA SESSÃO
- Logo real do marcelo.dev (trocar glifo do `MadeBy`).
- Team sem fluxo (CTA → `/entrar`; falta e-mail/form).
- Domínio próprio (adiado por decisão do Marcelo).
- Opcional: cachear `/p/[id]` com `unstable_cache` (hoje é dinâmico, mas rápido).
- Corrigir o site "vida-de-trader.vercel.app" que aparece na fatura Asaas (config
  da conta de produção, compartilhada).

## Infra plugada
- **Neon** Postgres `neondb` (org Vercel). Prisma 6.19.3.
- **Upstash** Redis `cotor.ia` (Free, sa-east-1, `robust-mongoose-115424.upstash.io`)
  — rate limit. Env no `.env` + Vercel prod.
- **Google OAuth** — client `cotor-ia-local`, consent screen publicada. Sem verificação.
- **Asaas** — billing **em produção**. Vercel prod: `ASAAS_ENV=production` +
  key de produção (sem o `$`) + `ASAAS_WEBHOOK_TOKEN` + `CRON_SECRET`. `.env`
  local segue no sandbox. Webhook cadastrado no painel de produção. Subscriptions
  API v3. Conta de prod compartilhada com outros projetos do Marcelo.
- **Vercel** — projeto `cotor-ia`, team Hobby, deploy via `vercel deploy --prod`.

## Fontes da verdade
`progress.md` · `historico/AAAA-MM-DD.md` · este arquivo. Repo:
github.com/Marcelo210598/cotor.ia
