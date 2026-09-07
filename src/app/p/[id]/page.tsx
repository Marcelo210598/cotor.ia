import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicPrompt } from "@/lib/prompts/queries";
import { PromptResult } from "@/components/cotor/prompt-result";
import { Wordmark } from "@/components/brand/wordmark";
import { MadeBy } from "@/components/brand/made-by";
import { LinkButton } from "@/components/ui/link-button";
import { Badge } from "@/components/ui/badge";
import { TASK_TYPE_LABELS } from "@/lib/ai/schema";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: PageProps<"/p/[id]">): Promise<Metadata> {
  const { id } = await params;
  const p = await getPublicPrompt(id);
  if (!p) return { title: "Prompt não encontrado" };

  const grade = p.score ? ` — Prompt Score ${p.score.overall}/100` : "";
  return {
    title: p.title,
    description: `Prompt de ${TASK_TYPE_LABELS[p.taskType]} feito com engenharia no COTOR.IA${grade}. Copie e use em qualquer IA.`,
    alternates: { canonical: `/p/${id}` },
    openGraph: {
      title: p.title,
      description: `Prompt de ${TASK_TYPE_LABELS[p.taskType]} feito no COTOR.IA${grade}.`,
      type: "article",
      url: `/p/${id}`,
    },
  };
}

export default async function PublicPromptPage({
  params,
}: PageProps<"/p/[id]">) {
  const { id } = await params;
  const p = await getPublicPrompt(id);
  if (!p) notFound();

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border/70">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-5">
          <Wordmark />
          <LinkButton href="/entrar" size="sm">
            Testar grátis
          </LinkButton>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10">
        <p className="eyebrow">prompt público</p>
        <h1 className="mt-3 font-heading text-2xl tracking-tight">{p.title}</h1>
        <div className="mt-3">
          <Badge variant="outline" className="font-mono">
            {TASK_TYPE_LABELS[p.taskType]}
          </Badge>
        </div>

        <div className="mt-8">
          {p.score ? (
            <PromptResult
              ir={p.ir}
              rendered={p.rendered}
              score={p.score}
              version={p.version}
              taskType={p.taskType}
            />
          ) : (
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-border bg-card p-4 font-mono text-[0.8rem] leading-relaxed text-foreground/90">
              {p.rendered}
            </pre>
          )}
        </div>

        <div className="mt-12 rounded-xl border border-coral/40 bg-card p-6 text-center">
          <p className="font-heading text-lg">
            Esse prompt foi montado pelo COTOR.IA
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Você diz a intenção crua. Ele faz a engenharia, pontua e otimiza.
          </p>
          <LinkButton href="/entrar" size="lg" className="mt-4">
            Fazer o meu prompt
          </LinkButton>
        </div>
      </main>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex h-12 max-w-4xl items-center justify-between px-5">
          <span className="eyebrow !tracking-[0.18em]">COTOR.IA</span>
          <MadeBy />
        </div>
      </footer>
    </div>
  );
}
