# COTOR.IA — Progresso

## Última atualização: 2026-09-06

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

## ✅ Concluído — Fase 3 (Prompt Score UI + Optimize)
- Gauge-mira do score → componente reutilizável (`src/components/cotor/
  score-gauge.tsx`), usado no landing E no `/app`.
- **Botão "Otimizar prompt"** → `optimizePrompt` reescreve o IR nas dimensões
  fracas → v2 (PromptVersion com `parentId`/lineage) + novo score, mostra o
  **delta** na tela e toast. Rota `POST /api/cotor/optimize`.
- **Overall = média ponderada das 10 dimensões** (determinística), não o número
  que o judge chuta. Pesos em `DIMENSION_WEIGHTS`. Faz o delta do Otimizar ter
  sentido (v2 melhor nas dims → nota sobe de verdade).
- **Latência**: `analyzeIntent` e `scorePrompt` migraram pro **Groq**
  (`gpt-oss-120b`, JSON mode + retry em 429). v1 caiu de ~45s → **~20s**.
  Síntese e otimização seguem no Haiku (qualidade de escrita).
- **Self-consistency**: mediana de N amostras implementada. Default **1**
  (free tier Groq = 8k TPM não aguenta 3 paralelas). `SCORE_SAMPLES=3` no env
  quando o Groq virar pago.
- `Score` ganhou `rationale`/`improvements`/`samples`; helper `saveVersion`.
- ⚠️ `optimize` precisa de `maxTokens` alto (4000) — IR de prompt complexo
  trunca em 2400 e vira JSON inválido.

## ✅ Deploy Vercel + mobile
- **NO AR: `https://cotor-ia.vercel.app`** (projeto `cotor-ia`, team Hobby,
  auto-deploy no push da `main`). Env vars no Vercel (Marcelo importou via
  `.env`). Landing + páginas legais funcionando em produção.
- ✅ **06/09 — Login Google em produção 100% resolvido:**
  - URI de redirect de produção registrado no Google Cloud (client `cotor-ia-local`):
    origem JS `https://cotor-ia.vercel.app` + redirect
    `https://cotor-ia.vercel.app/api/auth/callback/google` (localhost mantido).
  - **Login testado end-to-end pela UI** → `/entrar` → Google → consentimento →
    `/app` logado. Sem `redirect_uri_mismatch`. Neon confirmou nova session
    (mesmo user reusado — 2 sessions, 1 account).
  - `NEXT_PUBLIC_APP_URL` no Vercel prod já estava correto.
  - **OAuth consent screen PUBLICADA — status "Em produção".** Branding completo
    (nome, e-mails, domínio autorizado `cotor-ia.vercel.app`, links home/privacidade/
    termos). Escopos básicos (`email profile openid`) → **sem verificação do Google**.
    Qualquer usuário Google já loga. Rollback = botão "Voltar para o teste".
- Hero rotativo: cicla entre imagem / ata de reunião / e-mail de cobrança.
- `/termos` e `/privacidade` criados (matam 404).
- Crédito "criado por marcelo.dev" no rodapé do `/app` e da landing
  (`MadeBy`, mono, glifo losango, discreto). **Falta a logo real do marcelo.dev**
  — trocar o glifo quando o Marcelo mandar o arquivo.
- Mobile testado (Playwright @ 390px): sem overflow horizontal, tudo empilha,
  score/pricing/pipeline OK. `/entrar` alinhado ao topo no mobile.

## ✅ Concluído — Fase 4a + 4b (Organize)
- **Layout compartilhado do app** (`src/app/app/layout.tsx`): session-gate +
  header com nav (Novo / Biblioteca, `app-nav.tsx` com estado ativo) + footer.
  `/app/page.tsx` virou só o conteúdo do composer.
- **Biblioteca** `/app/prompts`: lista todos os prompts do user (título,
  intenção, tipo, tags, última nota, nº de versões, data relativa). Busca
  client-side (título+intenção) + filtro por tipo de tarefa + por tag. Menu ⋯
  por card: arquivar/desarquivar, excluir (dialog de confirmação). Filtro
  "Arquivados (n)" só aparece se houver; volta pra lista ativa sozinho quando o
  último sai. Fetch server-side direto (`src/lib/prompts/queries.ts`).
- **Detalhe** `/app/prompts/[id]`: trilha de versões (v1→vN, ação + nota),
  clicar mostra o `PromptResult` daquela versão (prompt + IR + score).
  **Comparar** duas versões → `VersionDiff` (`src/components/cotor/version-diff.tsx`,
  diff campo-a-campo do IR: +/− por item, delta de nota). **Restaurar** versão
  antiga → nova versão `BRANCH` (`POST /api/prompts/[id]/restore`) copiando o
  score da origem (texto idêntico = nota determinística, zero LLM). Editar
  título (inline) e tags (chips + input) → `PATCH /api/prompts/[id]`.
- Composer ganhou botão "Na biblioteca" no resultado (link pro detalhe).
- **Sem migration** — schema já tinha tudo (`tags`, `archived`, `PromptVersion.parentId`).
- Build + lint limpos. Testado no navegador: lista, filtros, detalhe, compare,
  restore, arquivar/desarquivar — tudo ok.

## ✅ Ajustes 06/09 (pós-Fase 4)
- **Preposição "com" vs "de"** no motor: "foto/imagem COM X", "eu e X", "ao lado
  de X" agora é lido como COMITATIVO (usuário + X na cena) — o motor pergunta quem
  mais aparece e se há foto de referência, e sinaliza que pessoa real fiel exige
  img2img/edição. Antes gerava retrato solo de X e ainda punha "sem múltiplas
  pessoas" no negative. Regras em `prompts.ts` (intent + synth IMAGE),
  `PROMPT_VERSION` → `2026-09-06.1`. Testado: "uma foto com o neymar" agora
  pergunta certo.
- **Bug de prompt duplicado corrigido:** a etapa de clarificação criava um Prompt
  na hora e a síntese criava outro (+ prompts órfãos se o usuário desistia). Agora
  a clarificação é stateless (só devolve perguntas) e o Prompt nasce uma única vez
  na síntese, com a `ClarificationSession` (perguntas+respostas) junto quando há
  respostas. `route.ts` + `composer.tsx` (não manda mais `promptId` na síntese).
  Retestado limpo: clarify + responder + "Montar" = 1 prompt (não 2).
- **Guardrail vazando pro prompt de imagem:** o COTOR punha "Nota técnica: usuário
  fornecerá foto de referência…" DENTRO do prompt renderizado. Agora, pra IMAGE,
  `guardrails` é canal só de aviso (não entra no texto) — `renderImage` já não
  renderiza guardrails; a tela `/app` mostra um bloco **"⚠️ Antes de usar"**
  (`PromptResult` recebe `taskType`). Guardrails de IMAGE ganharam 2 casos
  pré-definidos: (1) semelhança de pessoa real exige img2img, (2) geradores
  mainstream recusam retrato fotorrealista de pessoa pública. `PROMPT_VERSION` →
  `2026-09-06.2`. Testado: prompt sai limpo + callout aparece.

## ✅ Concluído — Fase 4c (Reuse: templates + variáveis)
- **Migration:** modelo `Template` (name, description, body, variables[],
  sourcePromptId) — `db push` no Neon feito.
- **Motor:** `templatize` (Haiku) — troca os valores específicos de um prompt
  concreto por `{{snake_case}}`. Prompt interno bem conservador (0–6 variáveis,
  **não toca em blocos de exemplo/few-shot**, não parametriza input que o usuário
  cola depois). `PROMPT_VERSION` → `2026-09-06.4`.
- **`/app/templates`** — lista + busca + excluir.
- **`/app/templates/[id]`** — form com 1 campo por variável → **preview ao vivo**
  do texto final → copiar; modo editar (nome/descrição/corpo, re-detecta `{{x}}`).
- **"Salvar como template"** no `/app/prompts/[id]` — dialog: nome + "Templatizar
  com IA" + edição do corpo antes de salvar.
- APIs: `GET/POST /api/templates`, `GET`(via query)/`PATCH`/`DELETE
  /api/templates/[id]`, `POST /api/templates/templatize`.
- Utils `src/lib/templates/vars.ts` (`extractVars`/`fillTemplate`/`humanizeVar`).
- Nav ganhou "Templates".
- **Fix de brinde:** `DialogContent` não tinha `max-height` — um textarea grande
  (prompt inteiro) estourava o modal pra fora da tela. Adicionado
  `max-h-[calc(100dvh-2rem)] overflow-y-auto` no `dialog.tsx` + cap nos textareas.
- Testado end-to-end no navegador: templatizar "email de cobrança pro Ricardo
  Souza" → 4 variáveis certas (`nome_cliente`, `numero_fatura`, `valor_devido`,
  `data_vencimento`) → preencher → copiar. Dados de teste limpos do Neon.

## ✅ Concluído — Fase 5a + 5b (Playground + Rate limit)
- **Playground:** `runPrompt(text, model)` em `engine.ts` roda o prompt num
  modelo real (Groq "Rápido" padrão ou Claude Haiku), como se colasse no ChatGPT.
  Rota `POST /api/playground`. Componente `PlaygroundPanel` (seletor de modelo,
  "Rodar o prompt" → saída scrollável). Aparece no **composer** (após gerar),
  **`/app/prompts/[id]`** (por versão) e **`/app/templates/[id]`** (texto
  preenchido). IMAGE = desabilitado ("cola direto no Midjourney/DALL·E").
- **Rate limit (Upstash):** `src/lib/ratelimit.ts` — `@upstash/ratelimit` +
  `@upstash/redis`, janela deslizante de 1 dia, limites por plano
  (FREE 20 gerações/dia · PRO 300 · TEAM 1000; idem optimize/templatize/playground).
  Aplicado em `/api/cotor` (só na síntese), `optimize`, `templates/templatize`,
  `playground`. Retorna 429 com msg amigável (+ "assina o Pro" no Free).
  **Fallback:** sem env do Upstash → não limita nada (não quebra local nem deploy).
  Redis fora do ar → deixa passar e loga.
- **Plano na sessão:** `auth.ts` ganhou `user.additionalFields.plan` — vem junto
  no `session.user.plan`, usado pelo rate limit.
- Testado: playground roda (Groq respondeu), IMAGE desabilitado. Rate limit
  inativo até plugar Upstash.
- 🔴 **PENDENTE: criar Redis no Upstash** (console.upstash.com, sa-east-1) →
  Marcelo passa `UPSTASH_REDIS_REST_URL` + `_TOKEN` → põe no `.env` + Vercel.

## 🚧 Em progresso / próximo
- **Upstash:** plugar as credenciais e testar o 429 de verdade.
- **Fase 5c — Billing (Asaas):** checkout + webhook + downgrade. Sessão dedicada
  (precisa da API key do Asaas + teste com Pix real).
- Logo real do marcelo.dev pro `MadeBy`.

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
| 3 | Prompt Score UI + Optimize (loop v2, latência) | ✅ |
| 4 | Organize + Reuse (biblioteca, versões, compare, restore, templates) | ✅ |
| 5 | Test (Playground) + Billing (Asaas) + rate limit | ⬜ |
| 6 | Deploy (domínio, Vercel, SEO, página pública de prompt) | ⬜ |

## 🔧 Rodar local
```bash
npm install
cp .env.example .env   # preencher DATABASE_URL, GOOGLE_*, GROQ_API_KEY, ANTHROPIC_API_KEY, BETTER_AUTH_SECRET
npm run db:generate
npm run dev             # http://localhost:3000
```
