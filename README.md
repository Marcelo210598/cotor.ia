# COTOR.IA

**Copiloto de engenharia de prompts.** Você escreve a intenção. O COTOR faz a
engenharia: identifica o objetivo, pergunta o que falta, monta a estrutura
profissional, pontua com rubrica técnica de 10 dimensões e otimiza em loop.

Create · Optimize · Test · Organize · Reuse

## Stack
- **Next.js 16** (App Router) · React 19 · TypeScript
- **Tailwind CSS v4** · shadcn/ui (base-nova / Base UI)
- **Prisma 6** + **Neon** (PostgreSQL)
- **Better Auth** — só Google OAuth
- Motor de IA: **Groq** (qwen3) + **Claude Haiku 4.5**
- Pagamento: **Asaas** (Fase 5)

## Rodar local
```bash
npm install
cp .env.example .env
# preencher: DATABASE_URL, BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID/SECRET,
#            GROQ_API_KEY, ANTHROPIC_API_KEY
npm run db:generate
npm run db:push        # sincroniza o schema no banco
npm run dev            # http://localhost:3000
```

## Scripts
| Comando | O quê |
|---|---|
| `npm run dev` | dev server (Turbopack) |
| `npm run build` / `start` | produção |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run db:push` | Prisma → banco |
| `npm run db:studio` | Prisma Studio |

## Estrutura
```
src/
  app/            rotas (landing, /entrar, /app, /api/auth)
  components/
    brand/        Reticle, Wordmark
    landing/      Hero, ScoreSection, Pipeline, Pillars, Pricing, ClosingCta
    site/         header, footer
    ui/           shadcn + LinkButton
  lib/            auth, auth-client, db, utils
prisma/schema.prisma
```

## Roadmap
Ver `progress.md`. Histórico de sessões em `historico/`.

## Notas de versão
- **Prisma fixo em 6.x** — o 7 tem breaking change (schema sem `url`).
- **shadcn base-nova = Base UI**, sem `asChild` — usar `<LinkButton>` ou `render`.
- Next 16: `middleware` → `proxy`; `next build` não roda lint.
