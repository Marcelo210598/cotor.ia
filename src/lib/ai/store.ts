import { prisma } from "@/lib/db";
import type { PromptIR, ScoreResult } from "./schema";
import { JUDGE_MODEL, PROMPT_VERSION } from "./engine";

const SCORE_SAMPLES = Number(process.env.SCORE_SAMPLES ?? 3);

type VersionAction = "GENERATE" | "OPTIMIZE" | "MANUAL_EDIT" | "BRANCH";

/** Cria uma PromptVersion + seu Score. Retorna a versão criada. */
export async function saveVersion(args: {
  promptId: string;
  number: number;
  action: VersionAction;
  parentId?: string;
  modelTarget: string;
  ir: PromptIR;
  rendered: string;
  score: ScoreResult;
}) {
  return prisma.promptVersion.create({
    data: {
      promptId: args.promptId,
      number: args.number,
      action: args.action,
      parentId: args.parentId,
      modelTarget: args.modelTarget,
      ir: args.ir as object,
      rendered: args.rendered,
      scores: {
        create: {
          overall: args.score.overall,
          grade: args.score.grade,
          dimensions: args.score.dimensoes as object,
          verdict: args.score.veredito,
          rationale: args.score.porQueEssaNota,
          improvements: args.score.oQueMelhorar,
          samples: Math.max(1, Math.min(5, SCORE_SAMPLES)),
          judgeModel: JUDGE_MODEL,
          rubricVersion: PROMPT_VERSION,
        },
      },
    },
    include: { scores: true },
  });
}
