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
| 2 | Núcleo de IA (Create + Optimize) | ⬜ |
| 3 | Prompt Score | ⬜ |
| 4 | Organize + Reuse | ⬜ |
| 5 | Test (Playground) + Billing | ⬜ |
| 6 | Deploy | ⬜ |

## Pendências imediatas
- Google OAuth (client no Google Cloud) — sem isso não loga.
- Fase 2: `src/lib/ai/`.

## Fontes da verdade
`progress.md` · `historico/AAAA-MM-DD.md` · este arquivo. Repo:
github.com/Marcelo210598/cotor.ia
