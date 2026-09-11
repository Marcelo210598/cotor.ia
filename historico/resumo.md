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
| 7 | Galeria de prompts prontos por categoria (feature do Pro) | 🟡 39/45 (falta AGENT + 1 CONVERSATION, Groq limite diário) |

**NO AR: https://cotor-ia.vercel.app** — Fases 1–7 em produção. Planos: Free 7/mês
· Starter R$19,90 (50/mês) · Pro R$39 (300/dia) · Team (só CTA). Billing Asaas
`ASAAS_ENV=production`, fluxo pagamento→webhook→upgrade **validado real**. Cron
diário `billing-sweep` derruba pra FREE no fim do ciclo.

## Estado 07/09 (fim do dia)
- **5c em produção e validada** (checkout Starter R$19,90 real → webhook → STARTER).
- **Ajustes de planos:** rate limit no checkout · troca Starter↔Pro sem cobrar de
  novo (`PUT` muda o valor) · Team tirado da landing · dunning "Abrir fatura".
- **Perf:** função em `gru1` (SP, do lado do Neon) + cookieCache 60s +
  `getSession()` deduplicado + `loading.tsx`.
- **Fase 6:** robots/sitemap/OG dinâmica/JSON-LD/FAQ/`llms.txt` + página pública
  `/p/[id]` (toggle "Compartilhar", OG por prompt).
- **Fase 7:** `/app/galeria` (Pro-only) + `scripts/seed-gallery.ts` (força
  taskType) + `POST /api/gallery/fork` (clone zero-LLM). **31/45 prompts.**
- **Logo marcelo.dev feita** (glifo do `MadeBy`).
- **Marcelo agora está PRO** (comp no Neon; assinatura segue STARTER R$19,90).

## Estado 11/09
- **Tentei fechar a Galeria** — `FRESH=1` recriou os 45 do zero, chegou em
  39/45; gap-fill (sem FRESH) mais 2 tentativas, sempre trava nos mesmos 6
  ("Parceiro de brainstorm" + os 5 de AGENT), sempre 429 do Groq.
- **Achado:** o TPD (200k/dia) do Groq free **não é exclusivo do seed** — é a
  mesma cota que o app usa em produção pra gerar prompt de usuário real, então
  ela já chega quase cheia e não esvazia em minutos. Esperar poucos minutos
  entre tentativas não resolve; precisa ser de madrugada (tráfego baixo) ou
  Dev Tier pago do Groq. **Ficou em 39/45.**

## 🚧 PRÓXIMA SESSÃO
1. **Fechar a Galeria** (falta AGENT inteiro + "Parceiro de brainstorm"):
   `npx tsx --env-file=.env scripts/seed-gallery.ts` **sem** `FRESH=1` (gap-fill
   por título, não recria os 39 bons) — rodar de madrugada. Detalhe em
   `historico/2026-09-07.md` e `historico/2026-09-11.md`.
2. Testar Galeria e troca de plano pela UI.
3. E-mails do COTOR (welcome/renovação/falha/cancelamento).
4. Histórico de faturas no `/app/conta` · aviso antes do 429 · fluxo do Team ·
   pastas na biblioteca · site na fatura Asaas ("vida-de-trader.vercel.app").
5. Opcional: `unstable_cache` no `/p/[id]`; `SCORE_SAMPLES=3` quando Groq for pago.

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
