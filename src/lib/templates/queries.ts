import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export type TemplateItem = {
  id: string;
  name: string;
  description: string | null;
  variables: string[];
  updatedAt: string;
};

export type TemplateDetail = TemplateItem & {
  body: string;
  sourcePromptId: string | null;
  createdAt: string;
};

export async function listTemplates(userId: string): Promise<TemplateItem[]> {
  const rows = await prisma.template.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      variables: true,
      updatedAt: true,
    },
  });
  return rows.map((t) => ({ ...t, updatedAt: t.updatedAt.toISOString() }));
}

export async function getTemplate(
  userId: string,
  id: string,
): Promise<TemplateDetail> {
  const t = await prisma.template.findFirst({ where: { id, userId } });
  if (!t) notFound();
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    body: t.body,
    variables: t.variables,
    sourcePromptId: t.sourcePromptId,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}
