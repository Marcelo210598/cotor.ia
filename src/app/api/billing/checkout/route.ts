import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isValidCpfCnpj } from "@/lib/billing";
import {
  billingEnabled,
  getOrCreateCustomer,
  createSubscription,
  getFirstInvoiceUrl,
  cancelSubscription,
  AsaasError,
} from "@/lib/asaas";

export const maxDuration = 30;

const bodySchema = z.object({
  cpfCnpj: z.string().min(11).max(20),
  plan: z.enum(["STARTER", "PRO"]).default("PRO"),
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
  if (user.plan === "TEAM") {
    return NextResponse.json(
      { error: "Você está no plano Team. Fale com a gente pra mudar." },
      { status: 409 },
    );
  }
  if (user.plan === body.plan && user.subscription?.status === "ACTIVE") {
    return NextResponse.json(
      { error: `Você já está no plano ${body.plan === "PRO" ? "Pro" : "Starter"}.` },
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

    // limpa a assinatura anterior — pendente (voltou pro checkout) ou troca de
    // plano (Starter↔Pro). O acesso atual só cai quando o pgto novo confirmar.
    const prev = user.subscription;
    if (prev?.externalId) {
      await cancelSubscription(prev.externalId).catch(() => {});
    }

    const sub = await createSubscription({ customerId, userId, plan: body.plan });

    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: body.plan,
        status: "PENDING",
        provider: "asaas",
        externalId: sub.id,
      },
      update: {
        plan: body.plan,
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
