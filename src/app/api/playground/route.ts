import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runPrompt } from "@/lib/ai/engine";
import { LlmError } from "@/lib/ai/llm";
import { rateLimit } from "@/lib/ratelimit";

export const maxDuration = 60;

const bodySchema = z.object({
  text: z.string().min(1).max(20000),
  model: z.enum(["groq", "haiku"]).optional(),
});

export async function POST(req: Request) {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (!session) {
    return NextResponse.json({ error: "Precisa entrar." }, { status: 401 });
  }

  const limited = await rateLimit("playground", session.user.id, session.user.plan);
  if (limited) return limited;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  try {
    const { output, model } = await runPrompt(body.text, body.model ?? "groq");

    await prisma.usageEvent.create({
      data: { userId: session.user.id, kind: "playground_run", model },
    });

    return NextResponse.json({ output, model });
  } catch (err) {
    if (err instanceof LlmError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error("[/api/playground]", err);
    return NextResponse.json(
      { error: "Não consegui rodar o prompt agora. Tenta de novo." },
      { status: 500 },
    );
  }
}
