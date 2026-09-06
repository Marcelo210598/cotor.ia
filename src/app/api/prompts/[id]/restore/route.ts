import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { JUDGE_MODEL, PROMPT_VERSION } from "@/lib/ai/engine";

const bodySchema = z.object({ versionId: z.string() });

/**
 * "Restaurar" nunca sobrescreve: cria uma nova versão (action BRANCH) com o
 * conteúdo de uma versão antiga. Como o texto renderizado é idêntico ao da
 * origem, copiamos o score dela — nota determinística, sem gastar LLM.
 */
export async function POST(
  req: Request,
  { params }: RouteContext<"/api/prompts/[id]/restore">,
) {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (!session) {
    return NextResponse.json({ error: "Precisa entrar." }, { status: 401 });
  }
  const { id } = await params;

  let versionId: string;
  try {
    versionId = bodySchema.parse(await req.json()).versionId;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const prompt = await prisma.prompt.findFirst({
    where: { id, userId: session.user.id },
    include: {
      versions: {
        orderBy: { number: "desc" },
        include: { scores: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
  });
  if (!prompt) {
    return NextResponse.json({ error: "Prompt não encontrado." }, { status: 404 });
  }

  const source = prompt.versions.find((v) => v.id === versionId);
  if (!source) {
    return NextResponse.json({ error: "Versão não encontrada." }, { status: 404 });
  }

  const headNumber = prompt.versions[0]?.number ?? source.number;
  if (source.number === headNumber) {
    return NextResponse.json(
      { error: "Essa já é a versão atual." },
      { status: 400 },
    );
  }

  const srcScore = source.scores[0];
  const created = await prisma.promptVersion.create({
    data: {
      promptId: prompt.id,
      number: headNumber + 1,
      action: "BRANCH",
      parentId: source.id,
      modelTarget: source.modelTarget,
      ir: source.ir as object,
      rendered: source.rendered,
      ...(srcScore && {
        scores: {
          create: {
            overall: srcScore.overall,
            grade: srcScore.grade,
            dimensions: srcScore.dimensions as object,
            verdict: srcScore.verdict,
            rationale: srcScore.rationale,
            improvements: srcScore.improvements,
            samples: srcScore.samples,
            judgeModel: srcScore.judgeModel || JUDGE_MODEL,
            rubricVersion: srcScore.rubricVersion || PROMPT_VERSION,
          },
        },
      }),
    },
  });

  await prisma.prompt.update({
    where: { id: prompt.id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({
    ok: true,
    number: created.number,
    from: source.number,
  });
}
