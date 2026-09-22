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
| 7 | Galeria de prompts prontos por categoria (feature do Pro) | ✅ 45/45 |

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

## ✅ Fase 7 FECHADA (15/09)
- Causa raiz confirmada: TPD do Groq free (200k/dia) é compartilhado com
  produção — sempre travava nos mesmos 6 itens porque, na hora de rodar
  (durante o dia, tráfego real ativo), a cota do dia já tava estourada; não
  tem relação com esses prompts em si.
- **Fix:** `analyzeIntent`/`scorePrompt` (`src/lib/ai/engine.ts`) ganharam
  escape hatch via env var — `ANALYZE_PROVIDER=haiku` / `SCORE_PROVIDER=haiku`
  fazem essas duas funções usarem Haiku (Anthropic) em vez de Groq. Produção
  não muda (sem a env var, segue Groq). Rodei o gap-fill com as duas env vars
  → 5/6 entraram na hora, 1 falhou por erro aleatório de schema do Haiku
  (11 dimensões em vez de 10), rodei de novo e entrou. **Galeria: 45/45,
  5 por categoria, confirmado no banco e na UI (`/app/galeria`, fork
  "Usar como base" testado ponta a ponta, sem erro de console).**
- Commit `5154b2b`, push + `vercel deploy --prod` feitos
  (`Aliased: https://cotor-ia.vercel.app`).

## ✅ Auditoria de segurança (15/09)
6 achados corrigidos e testados (rate limit ausente no clarify do `/api/cotor` — o mais
sério, timing attack em 2 webhooks, headers/CSP ausentes, cron fail-open, CVE
`deepmerge-ts`). Depois rodei Semgrep Pro (Trail of Bits, cross-file taint tracking) pra
confirmar de forma determinística — **0 findings** em 124 arquivos. Detalhe completo em
`progress.md` (seção "Auditoria de segurança") e `historico/2026-09-15.md`. Commits
`a1187a3`, `db6c8b5`, `b174bc4`.

## ✅ Fix de Functions Storage na Vercel (22/09)
E-mail da Vercel: time gratuito bateu 100% do limite de Function Storage (10GB
Hobby). Investigação achou o cotor-ia respondendo por 9,89GB (72% do total) —
`@prisma/client` empacotava o engine de TODOS os provedores de banco (mysql/
sqlserver/sqlite/cockroachdb + binário nativo darwin de dev) em cada rota, só
usando postgresql; + `sharp` bundlado sem necessidade. Fix: `outputFileTracingExcludes`
+ `outputFileTracingRoot` no `next.config.ts`. Medido: 2,43GB → 0,551GB por
deployment (-77%). Testado local e AO VIVO em produção (home, auth, OG image,
sitemap via Prisma, tudo ok). Commit `06c516f`, deployado. Detalhe completo em
`historico/2026-09-22.md`. (De brinde: projeto `califorce`, parado há 122 dias,
removido do time — respondia por 4GB de Deployment Storage.)

## 🚧 PRÓXIMA SESSÃO
1. ⚠️ Revogar o token do Semgrep (foi colado em texto puro no chat).
2. Testar troca de plano pela UI.
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
