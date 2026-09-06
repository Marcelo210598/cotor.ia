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

## Estado (fim do dia 06/09)
| Fase | O quê | Status |
|---|---|---|
| 1 | Fundação: scaffold, tema, landing, `/entrar`, auth, schema no Neon | ✅ |
| 2 | Núcleo de IA — Create (Prompt IR, pipeline `src/lib/ai/`, `/app`) | ✅ |
| 3 | Prompt Score UI + Optimize (loop v2, latência ~20s) | ✅ |
| 4 | Organize + Reuse (biblioteca `/app/prompts`, versões/diff/restore, templates `/app/templates` com `{{x}}` + templatize IA) | ✅ |
| 5a | Playground (`/api/playground` + `PlaygroundPanel`, roda o prompt num modelo real) | ✅ |
| 5b | Rate limit Upstash (429 por plano; FREE 20 gerações/dia) — **ativo em prod** | ✅ |
| 5c | Billing Asaas (checkout Pro R$39/mês + webhook + downgrade) | ⬜ próxima sessão |
| 6 | Domínio próprio + SEO + página pública de prompt | 🟡 no ar, falta domínio |

**NO AR: https://cotor-ia.vercel.app** — tudo funcionando em produção, login
Google OK, rate limit ativo.

## PRÓXIMA SESSÃO — Fase 5c (Billing Asaas)
Plano completo + setup que o Marcelo faz (conta sandbox Asaas, API key, webhook)
está em **`progress.md` → "PRÓXIMA SESSÃO — Fase 5c"** e no snapshot
`historico/2026-09-06.md` (fim do arquivo).

## Infra plugada
- **Neon** Postgres `neondb` (org Vercel). Prisma 6.19.3.
- **Upstash** Redis `cotor.ia` (Free, sa-east-1, `robust-mongoose-115424.upstash.io`)
  — rate limit. Env no `.env` + Vercel prod.
- **Google OAuth** — client `cotor-ia-local`, consent screen publicada. Sem verificação.
- **Vercel** — projeto `cotor-ia`, team Hobby, deploy via `vercel deploy --prod`.

## Fontes da verdade
`progress.md` · `historico/AAAA-MM-DD.md` · este arquivo. Repo:
github.com/Marcelo210598/cotor.ia
