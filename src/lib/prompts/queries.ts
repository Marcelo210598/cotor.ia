import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import {
  promptIrSchema,
  scoreResultSchema,
  type PromptIR,
  type ScoreResult,
  type TaskType,
} from "@/lib/ai/schema";
import type { ModelTarget } from "@/lib/ai/render";

export type LibraryItem = {
  id: string;
  title: string;
  intent: string;
  taskType: TaskType;
  tags: string[];
  archived: boolean;
  updatedAt: string;
  versionCount: number;
  latestScore: { overall: number; grade: string } | null;
};

/** Lista da biblioteca — tudo do usuário, ordenado por atividade recente. */
export async function listPrompts(userId: string): Promise<LibraryItem[]> {
  const rows = await prisma.prompt.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { versions: true } },
      versions: {
        orderBy: { number: "desc" },
        take: 1,
        include: { scores: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
  });

  return rows.map((p) => {
    const score = p.versions[0]?.scores[0];
    return {
      id: p.id,
      title: p.title,
      intent: p.intent,
      taskType: p.taskType as TaskType,
      tags: p.tags,
      archived: p.archived,
      updatedAt: p.updatedAt.toISOString(),
      versionCount: p._count.versions,
      latestScore: score
        ? { overall: score.overall, grade: score.grade }
        : null,
    };
  });
}

export type DetailVersion = {
  id: string;
  number: number;
  action: string;
  parentId: string | null;
  modelTarget: ModelTarget;
  ir: PromptIR;
  rendered: string;
  createdAt: string;
  score: ScoreResult | null;
};

export type PromptDetailData = {
  id: string;
  title: string;
  intent: string;
  taskType: TaskType;
  tags: string[];
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  versions: DetailVersion[];
};

/** Detalhe de um prompt + toda a árvore de versões. 404 se não for do usuário. */
export async function getPromptDetail(
  userId: string,
  id: string,
): Promise<PromptDetailData> {
  const p = await prisma.prompt.findFirst({
    where: { id, userId },
    include: {
      versions: {
        orderBy: { number: "asc" },
        include: { scores: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
  });

  if (!p) notFound();

  const versions: DetailVersion[] = p.versions.map((v) => {
    const ir = safeParseIr(v.ir);
    const score = v.scores[0] ? scoreFromRow(v.scores[0]) : null;
    return {
      id: v.id,
      number: v.number,
      action: v.action,
      parentId: v.parentId,
      modelTarget: (v.modelTarget as ModelTarget) ?? "generic",
      ir,
      rendered: v.rendered,
      createdAt: v.createdAt.toISOString(),
      score,
    };
  });

  return {
    id: p.id,
    title: p.title,
    intent: p.intent,
    taskType: p.taskType as TaskType,
    tags: p.tags,
    archived: p.archived,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    versions,
  };
}

function safeParseIr(value: unknown): PromptIR {
  const parsed = promptIrSchema.safeParse(value);
  if (parsed.success) return parsed.data;
  // versão antiga / schema divergente: devolve um IR vazio pra não quebrar a tela
  return {
    persona: "",
    objetivo: "",
    contexto: [],
    restricoes: [],
    passos: [],
    formatoSaida: "",
    exemplos: [],
    criteriosSucesso: [],
    guardrails: [],
  };
}

type ScoreRow = {
  overall: number;
  grade: string;
  verdict: string;
  dimensions: unknown;
  rationale: string;
  improvements: string[];
};

export function scoreFromRow(s: ScoreRow): ScoreResult | null {
  const parsed = scoreResultSchema.safeParse({
    overall: s.overall,
    grade: s.grade,
    veredito: s.verdict,
    dimensoes: s.dimensions,
    porQueEssaNota: s.rationale,
    oQueMelhorar: s.improvements,
  });
  return parsed.success ? parsed.data : null;
}
