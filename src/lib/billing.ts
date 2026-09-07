import { prisma } from "@/lib/db";
import { planLimit } from "@/lib/ratelimit";

// ─────────────────────────── CPF / CNPJ ───────────────────────────

/** Valida CPF (11 díg) ou CNPJ (14 díg) pelos dígitos verificadores. */
export function isValidCpfCnpj(raw: string): boolean {
  const d = raw.replace(/\D/g, "");
  if (d.length === 11) return isValidCpf(d);
  if (d.length === 14) return isValidCnpj(d);
  return false;
}

function isValidCpf(cpf: string): boolean {
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

function isValidCnpj(cnpj: string): boolean {
  if (/^(\d)\1{13}$/.test(cnpj)) return false;
  const calc = (len: number) => {
    const weights =
      len === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cnpj[i]) * weights[i];
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(cnpj[12]) && calc(13) === Number(cnpj[13]);
}

// ─────────────────────────── Resumo da conta ───────────────────────────

const USAGE_KINDS = ["generate", "optimize", "templatize", "playground_run"] as const;
type UsageKind = (typeof USAGE_KINDS)[number];

export type AccountSummary = {
  plan: "FREE" | "STARTER" | "PRO" | "TEAM";
  hasCpf: boolean;
  subscription: {
    status: "PENDING" | "ACTIVE" | "PAST_DUE" | "CANCELED";
    externalId: string | null;
    currentPeriodEnd: string | null;
  } | null;
  /** cota de geração ("cotor") pro plano — pra mostrar "usou X de Y" */
  generateQuota: { max: number; windowLabel: string };
  usage30d: Record<UsageKind, number>;
};

export async function getAccountSummary(
  userId: string,
): Promise<AccountSummary> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [user, sub, events] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, cpfCnpj: true },
    }),
    prisma.subscription.findUnique({ where: { userId } }),
    prisma.usageEvent.groupBy({
      by: ["kind"],
      where: { userId, createdAt: { gte: since } },
      _count: { _all: true },
    }),
  ]);

  const plan = (user?.plan ?? "FREE") as AccountSummary["plan"];
  const quota = planLimit(plan, "cotor");

  const usage30d = Object.fromEntries(
    USAGE_KINDS.map((k) => [k, 0]),
  ) as Record<UsageKind, number>;
  for (const e of events) {
    if ((USAGE_KINDS as readonly string[]).includes(e.kind)) {
      usage30d[e.kind as UsageKind] = e._count._all;
    }
  }

  return {
    plan,
    hasCpf: !!user?.cpfCnpj,
    subscription: sub
      ? {
          status: sub.status,
          externalId: sub.externalId,
          currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
        }
      : null,
    generateQuota: {
      max: quota.max,
      windowLabel: quota.window === "1 d" ? "dia" : "mês",
    },
    usage30d,
  };
}
