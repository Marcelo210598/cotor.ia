import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { listFeaturedPrompts } from "@/lib/prompts/queries";
import { LinkButton } from "@/components/ui/link-button";
import { GalleryClient } from "./gallery-client";

export const metadata = { title: "Galeria" };

export default async function GaleriaPage() {
  const session = await getSession();
  if (!session) redirect("/entrar");

  const isPro =
    session.user.plan === "PRO" || session.user.plan === "TEAM";

  if (!isPro) {
    return (
      <>
        <p className="eyebrow">Galeria</p>
        <h1 className="mt-3 font-heading text-2xl tracking-tight">
          Prompts prontos, feitos pelo COTOR
        </h1>
        <div className="mt-8 max-w-lg rounded-xl border border-coral/40 bg-card p-6">
          <p className="text-sm text-foreground/85">
            A Galeria tem dezenas de prompts profissionais — um por categoria de
            tarefa — já estruturados e pontuados. Você abre, copia ou usa como
            base pra sua versão, <span className="text-foreground">sem gastar geração</span>.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            É uma feature do plano <span className="text-foreground">Pro</span>.
          </p>
          <LinkButton href="/app/conta" size="lg" className="mt-4">
            Ver o Pro
          </LinkButton>
        </div>
      </>
    );
  }

  const groups = await listFeaturedPrompts();

  return (
    <>
      <p className="eyebrow">Galeria</p>
      <h1 className="mt-3 font-heading text-2xl tracking-tight">
        Prompts prontos, feitos pelo COTOR
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Cada um passou pelo pipeline: estruturado, pontuado e otimizado. Abre,
        copia, ou usa como base pra tua versão — sem gastar geração.
      </p>
      <div className="mt-8">
        <GalleryClient groups={groups} />
      </div>
    </>
  );
}
