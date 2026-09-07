import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getFeaturedForFork } from "@/lib/prompts/queries";
import { JUDGE_MODEL, PROMPT_VERSION } from "@/lib/ai/engine";

const bodySchema = z.object({ promptId: z.string() });

/**
 * "Usar como base": clona um prompt da Galeria pra biblioteca do usuário — copia
 * a versão head (IR + texto + score), sem gastar LLM. Só Pro/Team.
 */
export async function POST(req: Request) {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (!session) {
    return NextResponse.json({ error: "Precisa entrar." }, { status: 401 });
  }
  const plan = session.user.plan;
  if (plan !== "PRO" && plan !== "TEAM") {
    return NextResponse.json(
      { error: "A Galeria é do plano Pro.", code: "pro_only" },
      { status: 403 },
    );
  }

  let promptId: string;
  try {
    promptId = bodySchema.parse(await req.json()).promptId;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const src = await getFeaturedForFork(promptId);
  if (!src) {
    return NextResponse.json({ error: "Prompt não encontrado." }, { status: 404 });
  }

  const s = src.score;
  const created = await prisma.prompt.create({
    data: {
      userId: session.user.id,
      title: src.title,
      intent: src.intent,
      taskType: src.taskType,
      tags: ["galeria"],
      versions: {
        create: {
          number: 1,
          action: "BRANCH",
          modelTarget: src.modelTarget,
          ir: src.ir as object,
          rendered: src.rendered,
          ...(s && {
            scores: {
              create: {
                overall: s.overall,
                grade: s.grade,
                dimensions: s.dimensions as object,
                verdict: s.verdict,
                rationale: s.rationale,
                improvements: s.improvements,
                samples: s.samples,
                judgeModel: s.judgeModel || JUDGE_MODEL,
                rubricVersion: s.rubricVersion || PROMPT_VERSION,
              },
            },
          }),
        },
      },
    },
  });

  return NextResponse.json({ ok: true, id: created.id });
}
