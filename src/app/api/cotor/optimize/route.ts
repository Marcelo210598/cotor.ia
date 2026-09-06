import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { optimizePrompt, JUDGE_MODEL } from "@/lib/ai/engine";
import { saveVersion } from "@/lib/ai/store";
import { LlmError } from "@/lib/ai/llm";
import { rateLimit } from "@/lib/ratelimit";
import {
  promptIrSchema,
  scoreResultSchema,
  type TaskType,
} from "@/lib/ai/schema";
import type { ModelTarget } from "@/lib/ai/render";

export const maxDuration = 60;

const bodySchema = z.object({ promptId: z.string() });

export async function POST(req: Request) {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (!session) {
    return NextResponse.json({ error: "Precisa entrar." }, { status: 401 });
  }

  const limited = await rateLimit("optimize", session.user.id, session.user.plan);
  if (limited) return limited;

  let promptId: string;
  try {
    promptId = bodySchema.parse(await req.json()).promptId;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const prompt = await prisma.prompt.findFirst({
    where: { id: promptId, userId: session.user.id },
    include: {
      versions: {
        orderBy: { number: "desc" },
        take: 1,
        include: { scores: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
  });

  const latest = prompt?.versions[0];
  const latestScore = latest?.scores[0];
  if (!prompt || !latest || !latestScore) {
    return NextResponse.json(
      { error: "Não achei uma versão pra otimizar." },
      { status: 404 },
    );
  }

  try {
    const ir = promptIrSchema.parse(latest.ir);
    const prevScore = scoreResultSchema.parse({
      overall: latestScore.overall,
      grade: latestScore.grade,
      veredito: latestScore.verdict,
      dimensoes: latestScore.dimensions,
      porQueEssaNota: latestScore.rationale,
      oQueMelhorar: latestScore.improvements,
    });

    const result = await optimizePrompt({
      ir,
      score: prevScore,
      taskType: prompt.taskType as TaskType,
      target: latest.modelTarget as ModelTarget,
    });

    await saveVersion({
      promptId: prompt.id,
      number: latest.number + 1,
      action: "OPTIMIZE",
      parentId: latest.id,
      modelTarget: latest.modelTarget,
      ir: result.ir,
      rendered: result.rendered,
      score: result.score,
    });

    await prisma.usageEvent.create({
      data: { userId: session.user.id, kind: "optimize", model: JUDGE_MODEL },
    });

    return NextResponse.json({
      stage: "result",
      promptId: prompt.id,
      number: latest.number + 1,
      ir: result.ir,
      rendered: result.rendered,
      target: latest.modelTarget,
      score: result.score,
      delta: result.score.overall - prevScore.overall,
      previous: { rendered: latest.rendered, overall: prevScore.overall },
    });
  } catch (err) {
    if (err instanceof LlmError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error("[/api/cotor/optimize]", err);
    return NextResponse.json(
      { error: "Não consegui otimizar agora. Tenta de novo." },
      { status: 500 },
    );
  }
}
