import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Cron diário (vercel.json). Derruba pra FREE quem tem plano pago mas a
// assinatura acabou:
//  - CANCELED  → FREE assim que passa `currentPeriodEnd`
//  - PAST_DUE  → FREE depois de 3 dias de carência além do `currentPeriodEnd`
//
// O webhook do Asaas cuida do caminho feliz (pagou → PRO/STARTER). Isto aqui é
// só a rede de segurança pro fim de ciclo, que não tem evento de pagamento.

export const maxDuration = 30;

const GRACE_DAYS = 3;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const graceCutoff = new Date(now.getTime() - GRACE_DAYS * 86400_000);

  const stale = await prisma.subscription.findMany({
    where: {
      status: { in: ["CANCELED", "PAST_DUE"] },
      currentPeriodEnd: { lt: now },
      user: { plan: { not: "FREE" } },
    },
    select: { userId: true, status: true, currentPeriodEnd: true },
  });

  let downgraded = 0;
  for (const s of stale) {
    if (
      s.status === "PAST_DUE" &&
      s.currentPeriodEnd &&
      s.currentPeriodEnd > graceCutoff
    ) {
      continue; // ainda na carência
    }
    await prisma.user.update({
      where: { id: s.userId },
      data: { plan: "FREE" },
    });
    downgraded++;
  }

  return NextResponse.json({ ok: true, checked: stale.length, downgraded });
}
