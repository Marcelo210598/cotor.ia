import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limit por usuário e ação, janela deslizante de 1 dia, limites por plano.
 * Sem Upstash configurado (env vazias) → não limita nada. Assim dá pra rodar
 * local e o deploy não quebra antes de plugar as credenciais.
 */

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

export type RlAction = "cotor" | "optimize" | "templatize" | "playground";

const LIMITS: Record<string, Record<RlAction, number>> = {
  FREE: { cotor: 20, optimize: 15, templatize: 15, playground: 30 },
  PRO: { cotor: 300, optimize: 300, templatize: 300, playground: 500 },
  TEAM: { cotor: 1000, optimize: 1000, templatize: 1000, playground: 2000 },
};

const cache = new Map<string, Ratelimit>();

function limiter(plan: string, action: RlAction): Ratelimit | null {
  if (!redis) return null;
  const key = `${plan}:${action}`;
  let rl = cache.get(key);
  if (!rl) {
    const max = (LIMITS[plan] ?? LIMITS.FREE)[action];
    rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, "1 d"),
      prefix: `cotor:rl:${action}`,
      analytics: false,
    });
    cache.set(key, rl);
  }
  return rl;
}

/** 429 se estourou o limite diário; `null` se pode seguir. */
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
    const resetMin = Math.max(1, Math.round((reset - Date.now()) / 60000));
    return NextResponse.json(
      {
        error:
          p === "FREE"
            ? `Limite diário do plano Free atingido (${limit}/dia). Volta em ~${resetMin} min ou assina o Pro.`
            : `Limite diário atingido (${limit}/dia). Volta em ~${resetMin} min.`,
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
