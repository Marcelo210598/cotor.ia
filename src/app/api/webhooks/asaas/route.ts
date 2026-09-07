import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

// Webhook do Asaas. Autenticação: header `asaas-access-token` == ASAAS_WEBHOOK_TOKEN
// (definido por nós no painel de Webhooks do Asaas).
//
// Regra de ouro do Asaas: responder 200 rápido pra qualquer evento entendido ou
// não. Se a gente devolver erro, ele entra em fila de retry e PAUSA a fila toda.

export const maxDuration = 15;

const TOKEN = process.env.ASAAS_WEBHOOK_TOKEN || "";

type AsaasEntity = {
  id?: string;
  customer?: string;
  subscription?: string;
  externalReference?: string | null;
  dueDate?: string;
  status?: string;
};

type AsaasWebhook = {
  event: string;
  payment?: AsaasEntity;
  subscription?: AsaasEntity;
};

function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

/** Descobre qual user esse evento afeta. */
async function resolveUserId(w: AsaasWebhook): Promise<string | null> {
  const ent = w.payment ?? w.subscription;
  if (!ent) return null;

  // 1) externalReference = nosso userId (setado em customer/subscription)
  if (ent.externalReference) {
    const u = await prisma.user.findUnique({
      where: { id: ent.externalReference },
      select: { id: true },
    });
    if (u) return u.id;
  }
  // 2) pela assinatura no nosso banco
  const subId = ent.subscription ?? (w.subscription ? ent.id : undefined);
  if (subId) {
    const s = await prisma.subscription.findFirst({
      where: { externalId: subId },
      select: { userId: true },
    });
    if (s) return s.userId;
  }
  // 3) pelo customer do Asaas
  if (ent.customer) {
    const u = await prisma.user.findFirst({
      where: { asaasCustomerId: ent.customer },
      select: { id: true },
    });
    if (u) return u.id;
  }
  return null;
}

async function activate(userId: string, w: AsaasWebhook) {
  const pay = w.payment;
  const base = pay?.dueDate ? new Date(pay.dueDate) : new Date();
  const periodEnd = addMonths(base, 1);
  const externalId = pay?.subscription ?? w.subscription?.id ?? undefined;

  const subData: Prisma.SubscriptionUncheckedUpdateInput = {
    plan: "PRO",
    status: "ACTIVE",
    provider: "asaas",
    currentPeriodEnd: periodEnd,
    ...(externalId ? { externalId } : {}),
  };

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { plan: "PRO" } }),
    prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: "PRO",
        status: "ACTIVE",
        provider: "asaas",
        externalId: externalId ?? null,
        currentPeriodEnd: periodEnd,
      },
      update: subData,
    }),
  ]);
}

async function markPastDue(userId: string) {
  await prisma.subscription.updateMany({
    where: { userId },
    data: { status: "PAST_DUE" },
  });
  // não derruba o plano ainda — carência até o gate/periodEnd
}

async function downgrade(userId: string) {
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { plan: "FREE" } }),
    prisma.subscription.updateMany({
      where: { userId },
      data: { status: "CANCELED" },
    }),
  ]);
}

export async function POST(req: Request) {
  const token = req.headers.get("asaas-access-token");
  if (!TOKEN || token !== TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let w: AsaasWebhook;
  try {
    w = JSON.parse(await req.text());
  } catch {
    return NextResponse.json({ ok: true, ignored: "bad json" });
  }

  try {
    const userId = await resolveUserId(w);
    if (!userId) {
      console.warn("[webhook/asaas] evento sem user:", w.event);
      return NextResponse.json({ ok: true, ignored: "no user" });
    }

    switch (w.event) {
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED":
        await activate(userId, w);
        break;

      case "PAYMENT_OVERDUE":
        await markPastDue(userId);
        break;

      case "PAYMENT_REFUNDED":
      case "PAYMENT_CHARGEBACK_REQUESTED":
      case "SUBSCRIPTION_DELETED":
      case "SUBSCRIPTION_INACTIVATED":
        await downgrade(userId);
        break;

      default:
        // PAYMENT_CREATED, PAYMENT_UPDATED, etc — nada a fazer
        break;
    }
  } catch (err) {
    // loga mas responde 200: retry do Asaas trava a fila e não resolve bug nosso
    console.error("[webhook/asaas]", w.event, err);
  }

  return NextResponse.json({ ok: true });
}
