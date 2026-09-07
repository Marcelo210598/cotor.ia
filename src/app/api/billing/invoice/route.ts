import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { billingEnabled, getOpenInvoiceUrl } from "@/lib/asaas";

export const maxDuration = 20;

/** Devolve a URL da fatura em aberto da assinatura do usuário (dunning). */
export async function GET() {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (!session) {
    return NextResponse.json({ error: "Precisa entrar." }, { status: 401 });
  }
  if (!billingEnabled()) {
    return NextResponse.json({ invoiceUrl: null });
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: { externalId: true },
  });
  if (!sub?.externalId) {
    return NextResponse.json({ invoiceUrl: null });
  }

  const invoiceUrl = await getOpenInvoiceUrl(sub.externalId).catch(() => null);
  return NextResponse.json({ invoiceUrl });
}
