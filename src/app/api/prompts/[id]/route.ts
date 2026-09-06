import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const patchSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  tags: z.array(z.string().trim().min(1).max(24)).max(12).optional(),
  archived: z.boolean().optional(),
});

async function requireUser() {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  return session?.user.id ?? null;
}

export async function PATCH(
  req: Request,
  { params }: RouteContext<"/api/prompts/[id]">,
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

  const { count } = await prisma.prompt.updateMany({
    where: { id, userId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.tags !== undefined && {
        tags: [...new Set(data.tags.map((t) => t.toLowerCase()))],
      }),
      ...(data.archived !== undefined && { archived: data.archived }),
    },
  });
  if (count === 0) {
    return NextResponse.json({ error: "Prompt não encontrado." }, { status: 404 });
  }

  const prompt = await prisma.prompt.findUnique({ where: { id } });
  return NextResponse.json({ ok: true, prompt });
}

export async function DELETE(
  _req: Request,
  { params }: RouteContext<"/api/prompts/[id]">,
) {
  const userId = await requireUser();
  if (!userId) {
    return NextResponse.json({ error: "Precisa entrar." }, { status: 401 });
  }
  const { id } = await params;

  const { count } = await prisma.prompt.deleteMany({ where: { id, userId } });
  if (count === 0) {
    return NextResponse.json({ error: "Prompt não encontrado." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
