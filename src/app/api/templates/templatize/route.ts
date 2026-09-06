import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { templatize, SYNTH_MODEL } from "@/lib/ai/engine";
import { extractVars } from "@/lib/templates/vars";
import { LlmError } from "@/lib/ai/llm";

export const maxDuration = 60;

const bodySchema = z.object({ text: z.string().min(1).max(20000) });

export async function POST(req: Request) {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (!session) {
    return NextResponse.json({ error: "Precisa entrar." }, { status: 401 });
  }

  let text: string;
  try {
    text = bodySchema.parse(await req.json()).text;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  try {
    const result = await templatize(text);
    // body é a fonte da verdade das variáveis
    const variables = extractVars(result.body);

    await prisma.usageEvent.create({
      data: {
        userId: session.user.id,
        kind: "templatize",
        model: SYNTH_MODEL,
      },
    });

    return NextResponse.json({ body: result.body, variables });
  } catch (err) {
    if (err instanceof LlmError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error("[/api/templates/templatize]", err);
    return NextResponse.json(
      { error: "Não consegui templatizar agora. Tenta de novo." },
      { status: 500 },
    );
  }
}
