import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Wordmark } from "@/components/brand/wordmark";
import { MadeBy } from "@/components/brand/made-by";
import { SignOutButton } from "./sign-out-button";
import { AppNav } from "./app-nav";

export default async function AppLayout({
  children,
}: LayoutProps<"/app">) {
  const session = await getSession();

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
            <Link
              href="/app/conta"
              className="transition-colors hover:text-foreground"
            >
              Conta
            </Link>
            <span className="hidden text-muted-foreground/50 sm:inline">
              {session.user.email}
            </span>
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
