import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  analyzeIntent,
  synthesizePrompt,
  scorePrompt,
  PROMPT_VERSION,
  JUDGE_MODEL,
} from "@/lib/ai/engine";
import { LlmError } from "@/lib/ai/llm";
import type { IntentAnalysis } from "@/lib/ai/schema";

export const maxDuration = 60;

const bodySchema = z.object({
  intent: z.string().min(3).max(4000),
  promptId: z.string().optional(),
  answers: z
    .array(
      z.object({
        id: z.string(),
        pergunta: z.string(),
        resposta: z.string().max(2000),
      }),
    )
    .optional(),
  skipQuestions: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (!session) {
    return NextResponse.json({ error: "Precisa entrar." }, { status: 401 });
  }
  const userId = session.user.id;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  try {
    const analysis = await analyzeIntent(body.intent);

    const wantsQuestions =
      analysis.perguntas.length > 0 && !body.answers && !body.skipQuestions;

    // ── etapa de clarificação ──
    if (wantsQuestions) {
      const prompt = await prisma.prompt.create({
        data: {
          userId,
          title: title(analysis),
          intent: body.intent,
          taskType: analysis.taskType,
          clarificationSessions: {
            create: { questions: analysis.perguntas },
          },
        },
      });
      return NextResponse.json({
        stage: "clarify",
        promptId: prompt.id,
        analysis,
      });
    }

    // ── síntese + score ──
    const respostas = (body.answers ?? []).map((a) => ({
      pergunta: a.pergunta,
      resposta: a.resposta,
    }));
    const { ir, rendered, target } = await synthesizePrompt({
      intent: body.intent,
      analysis,
      respostas,
    });
    const score = await scorePrompt(rendered, { taskType: analysis.taskType });

    const promptId = await persist({
      userId,
      existingId: body.promptId,
      analysis,
      intent: body.intent,
      answers: body.answers,
      ir,
      rendered,
      target,
      score,
    });

    return NextResponse.json({
      stage: "result",
      promptId,
      analysis,
      ir,
      rendered,
      target,
      score,
    });
  } catch (err) {
    if (err instanceof LlmError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error("[/api/cotor]", err);
    return NextResponse.json(
      { error: "Algo quebrou no motor. Tenta de novo." },
      { status: 500 },
    );
  }
}

function title(a: IntentAnalysis): string {
  const t = a.resumoObjetivo.trim();
  return (t.length > 70 ? t.slice(0, 67) + "…" : t) || "Prompt sem título";
}

async function persist(args: {
  userId: string;
  existingId?: string;
  analysis: IntentAnalysis;
  intent: string;
  answers?: { id: string; pergunta: string; resposta: string }[];
  ir: unknown;
  rendered: string;
  target: string;
  score: {
    overall: number;
    grade: string;
    dimensoes: unknown;
    veredito: string;
  };
}): Promise<string> {
  const prompt = args.existingId
    ? await prisma.prompt.update({
        where: { id: args.existingId, userId: args.userId },
        data: { taskType: args.analysis.taskType, title: title(args.analysis) },
      })
    : await prisma.prompt.create({
        data: {
          userId: args.userId,
          title: title(args.analysis),
          intent: args.intent,
          taskType: args.analysis.taskType,
        },
      });

  if (args.existingId && args.answers?.length) {
    const cs = await prisma.clarificationSession.findFirst({
      where: { promptId: prompt.id },
      orderBy: { createdAt: "desc" },
    });
    if (cs) {
      await prisma.clarificationSession.update({
        where: { id: cs.id },
        data: {
          answers: Object.fromEntries(
            args.answers.map((a) => [a.id, a.resposta]),
          ),
        },
      });
    }
  }

  await prisma.promptVersion.create({
    data: {
      promptId: prompt.id,
      number: 1,
      action: "GENERATE",
      modelTarget: args.target,
      ir: args.ir as object,
      rendered: args.rendered,
      scores: {
        create: {
          overall: args.score.overall,
          grade: args.score.grade,
          dimensions: args.score.dimensoes as object,
          verdict: args.score.veredito,
          judgeModel: JUDGE_MODEL,
          rubricVersion: PROMPT_VERSION,
        },
      },
    },
  });

  await prisma.usageEvent.create({
    data: { userId: args.userId, kind: "generate", model: JUDGE_MODEL },
  });

  return prompt.id;
}
