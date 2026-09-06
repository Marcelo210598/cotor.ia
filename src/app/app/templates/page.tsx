import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listTemplates } from "@/lib/templates/queries";
import { TemplatesClient } from "./templates-client";

export const metadata = { title: "Templates" };

export default async function TemplatesPage() {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (!session) redirect("/entrar");

  const templates = await listTemplates(session.user.id);

  return (
    <>
      <p className="eyebrow">Templates</p>
      <h1 className="mt-3 font-heading text-2xl tracking-tight">
        Prompts reutilizáveis
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Um template é um prompt com buracos{" "}
        <code className="font-mono text-foreground/80">{"{{variavel}}"}</code> —
        você preenche e copia o texto final. Crie um a partir de qualquer prompt
        da biblioteca.
      </p>
      <div className="mt-8">
        <TemplatesClient initial={templates} />
      </div>
    </>
  );
}
