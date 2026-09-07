import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { billingEnabled, cancelSubscription, AsaasError } from "@/lib/asaas";

export const maxDuration = 30;

export async function POST() {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (!session) {
    return NextResponse.json({ error: "Precisa entrar." }, { status: 401 });
  }
  if (!billingEnabled()) {
    return NextResponse.json({ error: "Indisponível." }, { status: 503 });
  }

  const userId = session.user.id;
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub || !sub.externalId) {
    return NextResponse.json(
      { error: "Nenhuma assinatura ativa." },
      { status: 404 },
    );
  }
  if (sub.status === "CANCELED") {
    return NextResponse.json({ ok: true, alreadyCanceled: true });
  }

  try {
    await cancelSubscription(sub.externalId);
  } catch (err) {
    if (err instanceof AsaasError) {
      console.error("[billing/cancel] asaas:", err.message);
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error("[billing/cancel]", err);
    return NextResponse.json(
      { error: "Não deu pra cancelar agora. Tenta de novo." },
      { status: 500 },
    );
  }

  // Marca cancelada. O acesso PRO continua até currentPeriodEnd (se houver);
  // o cron do webhook (SUBSCRIPTION_DELETED / falta de PAYMENT_CONFIRMED) e o
  // gate de plano cuidam do downgrade efetivo.
  await prisma.subscription.update({
    where: { userId },
    data: { status: "CANCELED" },
  });

  const keepUntil = sub.currentPeriodEnd;
  const stillPro = keepUntil ? keepUntil.getTime() > Date.now() : false;
  if (!stillPro) {
    await prisma.user.update({ where: { id: userId }, data: { plan: "FREE" } });
  }

  return NextResponse.json({
    ok: true,
    keepProUntil: stillPro ? keepUntil!.toISOString() : null,
  });
}
