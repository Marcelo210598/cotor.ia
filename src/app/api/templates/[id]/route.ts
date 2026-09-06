import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { extractVars } from "@/lib/templates/vars";

async function requireUser() {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  return session?.user.id ?? null;
}

const patchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(280).nullable().optional(),
  body: z.string().min(1).max(20000).optional(),
});

export async function PATCH(
  req: Request,
  { params }: RouteContext<"/api/templates/[id]">,
) {
  const userId = await requireUser();
  if (!userId) {
    return NextResponse.json({ error: "Precisa entrar." }, { status: 401 });
  }
  const { id } = await params;

  let data: z.infer<typeof patchSchema>;
  try {
    data = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada pra atualizar." }, { status: 400 });
  }

  const { count } = await prisma.template.updateMany({
    where: { id, userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && {
        description: data.description || null,
      }),
      ...(data.body !== undefined && {
        body: data.body,
        variables: extractVars(data.body),
      }),
    },
  });
  if (count === 0) {
    return NextResponse.json({ error: "Template não encontrado." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: RouteContext<"/api/templates/[id]">,
) {
  const userId = await requireUser();
  if (!userId) {
    return NextResponse.json({ error: "Precisa entrar." }, { status: 401 });
  }
  const { id } = await params;
  const { count } = await prisma.template.deleteMany({ where: { id, userId } });
  if (count === 0) {
    return NextResponse.json({ error: "Template não encontrado." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
