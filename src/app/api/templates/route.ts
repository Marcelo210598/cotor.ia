import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { extractVars } from "@/lib/templates/vars";
import { listTemplates } from "@/lib/templates/queries";

async function requireUser() {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  return session?.user.id ?? null;
}

export async function GET() {
  const userId = await requireUser();
  if (!userId) {
    return NextResponse.json({ error: "Precisa entrar." }, { status: 401 });
  }
  return NextResponse.json({ templates: await listTemplates(userId) });
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(280).optional(),
  body: z.string().min(1).max(20000),
  sourcePromptId: z.string().optional(),
});

export async function POST(req: Request) {
  const userId = await requireUser();
  if (!userId) {
    return NextResponse.json({ error: "Precisa entrar." }, { status: 401 });
  }

  let data: z.infer<typeof createSchema>;
  try {
    data = createSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const template = await prisma.template.create({
    data: {
      userId,
      name: data.name,
      description: data.description || null,
      body: data.body,
      variables: extractVars(data.body),
      sourcePromptId: data.sourcePromptId || null,
    },
  });

  return NextResponse.json({ ok: true, id: template.id });
}
