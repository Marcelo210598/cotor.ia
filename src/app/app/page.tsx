import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Wordmark } from "@/components/brand/wordmark";
import { SignOutButton } from "./sign-out-button";
import { Composer } from "./composer";

export const metadata = { title: "Novo prompt" };

export default async function AppHome() {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);

  if (!session) redirect("/entrar");

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border/70">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <Wordmark href="/app" />
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="hidden sm:inline">{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
        <p className="eyebrow">Novo prompt</p>
        <h1 className="mt-3 font-heading text-2xl tracking-tight">
          Diz a intenção. O COTOR faz a engenharia.
        </h1>
        <div className="mt-8">
          <Composer />
        </div>
      </main>
    </div>
  );
}
