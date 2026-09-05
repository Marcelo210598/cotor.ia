import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Wordmark } from "@/components/brand/wordmark";

// Placeholder do produto — o núcleo (Create/Optimize/Score) entra na Fase 2.
export default async function AppHome() {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);

  if (!session) redirect("/entrar");

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col items-start gap-4 px-5 py-16">
      <Wordmark />
      <h1 className="font-heading text-2xl tracking-tight">
        Oi, {session.user.name?.split(" ")[0] ?? "dev"}.
      </h1>
      <p className="text-muted-foreground">
        O editor de prompts entra aqui na próxima fase. Por enquanto, a fundação
        está de pé: conta, sessão e banco.
      </p>
    </main>
  );
}
