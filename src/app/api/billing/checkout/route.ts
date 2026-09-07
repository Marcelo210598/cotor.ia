import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isValidCpfCnpj } from "@/lib/billing";
import {
  billingEnabled,
  getOrCreateCustomer,
  createProSubscription,
  getFirstInvoiceUrl,
  cancelSubscription,
  AsaasError,
} from "@/lib/asaas";

export const maxDuration = 30;

const bodySchema = z.object({
  cpfCnpj: z.string().min(11).max(20),
});

export async function POST(req: Request) {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (!session) {
    return NextResponse.json({ error: "Precisa entrar." }, { status: 401 });
  }
  if (!billingEnabled()) {
    return NextResponse.json(
      { error: "Assinatura indisponível no momento." },
      { status: 503 },
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }
  if (!isValidCpfCnpj(body.cpfCnpj)) {
    return NextResponse.json({ error: "CPF/CNPJ inválido." }, { status: 400 });
  }

  const userId = session.user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      plan: true,
      cpfCnpj: true,
      asaasCustomerId: true,
      subscription: { select: { externalId: true, status: true } },
    },
  });
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }
  if (user.plan === "PRO" || user.plan === "TEAM") {
    return NextResponse.json(
      { error: "Você já tem um plano pago ativo." },
      { status: 409 },
    );
  }

  const cpf = body.cpfCnpj.replace(/\D/g, "");

  try {
    const customerId = await getOrCreateCustomer({
      userId,
      name: user.name,
      email: user.email,
      cpfCnpj: cpf,
      existingId: user.asaasCustomerId,
    });

    await prisma.user.update({
      where: { id: userId },
      data: { cpfCnpj: cpf, asaasCustomerId: customerId },
    });

    // assinatura pendente antiga (usuário voltou pro checkout) → limpa antes
    const stale = user.subscription;
    if (stale?.externalId && stale.status !== "ACTIVE") {
      await cancelSubscription(stale.externalId).catch(() => {});
    }

    const sub = await createProSubscription({ customerId, userId });

    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: "PRO",
        status: "PENDING",
        provider: "asaas",
        externalId: sub.id,
      },
      update: {
        plan: "PRO",
        status: "PENDING",
        provider: "asaas",
        externalId: sub.id,
        currentPeriodEnd: null,
      },
    });

    const invoiceUrl = await getFirstInvoiceUrl(sub.id);
    if (!invoiceUrl) {
      // assinatura existe, só a fatura não materializou ainda — raro
      return NextResponse.json(
        {
          error:
            "Assinatura criada, mas a fatura ainda não abriu. Tenta de novo em instantes.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ invoiceUrl });
  } catch (err) {
    if (err instanceof AsaasError) {
      console.error("[billing/checkout] asaas:", err.message);
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error("[billing/checkout]", err);
    return NextResponse.json(
      { error: "Não deu pra iniciar a assinatura. Tenta de novo." },
      { status: 500 },
    );
  }
}
