# COTOR.IA — Resumo geral

## O que é
Copiloto de engenharia de prompts. O usuário escreve a intenção crua ("quero um
prompt pra analisar meus trades"); o COTOR faz a engenharia: identifica objetivo,
pergunta o que falta, monta estrutura profissional (Prompt IR), pontua com rubrica
de 10 dimensões e otimiza em loop. **Faz pelo usuário, não ensina.**

Tagline / pilares: **Create · Optimize · Test · Organize · Reuse**.

## Stack
Next 16 · React 19 · TS · Tailwind v4 · shadcn (base-nova/Base UI) · Prisma 6 +
Neon · Better Auth (Google OAuth) · Groq (qwen3) + Claude Haiku 4.5 · Asaas.

## Conceito-chave: Prompt IR
Objeto estruturado `{ persona, objetivo, contexto[], constraints[],
decomposicao[], formato_saida, exemplos[], criterios_sucesso[], guardrails[] }`.
Guardado como JSON em `PromptVersion.ir`. Renderers por modelo. É o que permite
multi-modelo, diff campo-a-campo e score consistente.

## Estado
| Fase | O quê | Status |
|---|---|---|
| 1 | Fundação: scaffold, tema, landing, `/entrar`, auth, schema no Neon | ✅ 05/09 |
| 2 | Núcleo de IA — Create (Prompt IR, pipeline `src/lib/ai/`, `/app`) | ✅ 05/09 |
| 3 | Prompt Score UI + Optimize (loop v2, latência ~20s) | ✅ 05/09 |
| 4 | Organize + Reuse | 🟡 4a+4b ✅ (biblioteca `/app/prompts`, versões, compare, restore, tags/arquivar) · 4c templates ⬜ |
| 5 | Test (Playground) + Billing (Asaas) + rate limit | ⬜ |
| 6 | Deploy (domínio, SEO, página pública de prompt) | 🟡 no ar em `cotor-ia.vercel.app`, falta domínio/SEO |

**NO AR: https://cotor-ia.vercel.app** — landing + `/app` + login Google
funcionando em produção (testado 06/09).

## Pendências imediatas
- Fase 4c: variáveis `{{x}}` + templates reutilizáveis (provável migration).
- Logo real do marcelo.dev pro `MadeBy` no rodapé.

## Auth (06/09 — resolvido)
Login Google em produção OK + OAuth consent screen **publicada ("Em produção")**.
Escopos básicos → sem verificação Google. Client `cotor-ia-local`, projeto GCloud
`cotor-ia`. Redirects: localhost + `https://cotor-ia.vercel.app/api/auth/callback/google`.

## Fontes da verdade
`progress.md` · `historico/AAAA-MM-DD.md` · este arquivo. Repo:
github.com/Marcelo210598/cotor.ia
