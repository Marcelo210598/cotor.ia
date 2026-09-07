import { NextResponse } from "next/server";
import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limit por usuário e ação, janela deslizante, limites por plano.
 *
 * FREE tem cota mensal (janela de 30 dias) — bate com o pricing da landing.
 * PRO/TEAM têm cota diária folgada, só pra barrar abuso/loop.
 *
 * Sem Upstash configurado (env vazias) → não limita nada. Dá pra rodar local e
 * o deploy não quebra antes de plugar as credenciais.
 */

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

export type RlAction = "cotor" | "optimize" | "templatize" | "playground";

type Rule = { max: number; window: Duration };

const LIMITS: Record<string, Record<RlAction, Rule>> = {
  FREE: {
    cotor: { max: 15, window: "30 d" },
    optimize: { max: 20, window: "30 d" },
    templatize: { max: 20, window: "30 d" },
    playground: { max: 30, window: "30 d" },
  },
  PRO: {
    cotor: { max: 300, window: "1 d" },
    optimize: { max: 300, window: "1 d" },
    templatize: { max: 300, window: "1 d" },
    playground: { max: 500, window: "1 d" },
  },
  TEAM: {
    cotor: { max: 1000, window: "1 d" },
    optimize: { max: 1000, window: "1 d" },
    templatize: { max: 1000, window: "1 d" },
    playground: { max: 2000, window: "1 d" },
  },
};

/** Cota da ação pro plano — usado também pela página de conta. */
export function planLimit(plan: string, action: RlAction): Rule {
  return (LIMITS[plan] ?? LIMITS.FREE)[action];
}

const cache = new Map<string, Ratelimit>();

function limiter(plan: string, action: RlAction): Ratelimit | null {
  if (!redis) return null;
  const key = `${plan}:${action}`;
  let rl = cache.get(key);
  if (!rl) {
    const { max, window } = planLimit(plan, action);
    rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, window),
      prefix: `cotor:rl:${action}`,
      analytics: false,
    });
    cache.set(key, rl);
  }
  return rl;
}

/** 429 se estourou a cota; `null` se pode seguir. */
export async function rateLimit(
  action: RlAction,
  userId: string,
  plan?: string | null,
): Promise<NextResponse | null> {
  const p = plan || "FREE";
  const rl = limiter(p, action);
  if (!rl) return null;

  try {
    const { success, limit, reset } = await rl.limit(userId);
    if (success) return null;

    const mins = Math.max(1, Math.round((reset - Date.now()) / 60000));
    const wait =
      mins < 90
        ? `~${mins} min`
        : mins < 60 * 48
          ? `~${Math.round(mins / 60)} h`
          : `~${Math.round(mins / (60 * 24))} dias`;

    return NextResponse.json(
      {
        error:
          p === "FREE"
            ? `Cota do plano Free atingida (${limit}/mês). Renova em ${wait} — ou assina o Pro pra continuar agora.`
            : `Limite de uso atingido (${limit}/dia). Volta em ${wait}.`,
        code: "rate_limited",
      },
      { status: 429 },
    );
  } catch (err) {
    // Redis fora do ar não pode derrubar o produto — deixa passar e loga.
    console.error("[ratelimit]", err);
    return null;
  }
}
