import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Wordmark } from "@/components/brand/wordmark";
import { MadeBy } from "@/components/brand/made-by";
import { SignOutButton } from "./sign-out-button";
import { AppNav } from "./app-nav";

export default async function AppLayout({
  children,
}: LayoutProps<"/app">) {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);

  if (!session) redirect("/entrar");

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border/70">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-5">
            <Wordmark href="/app" />
            <AppNav />
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="hidden sm:inline">{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
        {children}
      </main>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-5">
          <span className="eyebrow !tracking-[0.18em]">COTOR.IA</span>
          <MadeBy />
        </div>
      </footer>
    </div>
  );
}
