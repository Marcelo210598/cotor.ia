import type { Metadata } from "next";
import Link from "next/link";
import { Reticle } from "@/components/brand/reticle";
import { Wordmark } from "@/components/brand/wordmark";
import { GoogleSignInButton } from "./google-button";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function EntrarPage() {
  return (
    <main className="grid flex-1 lg:grid-cols-2">
      {/* painel da marca */}
      <div className="relative hidden overflow-hidden border-r border-border/70 lg:block">
        <div className="absolute inset-0 hairline-grid opacity-50" aria-hidden />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Wordmark />
          <div className="space-y-4">
            <Reticle locked className="h-10 w-10 text-foreground" />
            <p className="max-w-sm font-heading text-2xl leading-snug tracking-tight">
              Escreva a intenção.
              <br />O resto é engenharia.
            </p>
          </div>
          <p className="eyebrow">Create · Optimize · Test · Organize · Reuse</p>
        </div>
      </div>

      {/* card de login */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Wordmark />
          </div>
          <h1 className="font-heading text-2xl tracking-tight">Entrar no COTOR</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Uma conta, um clique. Sem senha pra esquecer.
          </p>

          <div className="mt-8">
            <GoogleSignInButton />
          </div>

          <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
            Ao continuar você concorda com os{" "}
            <Link href="/termos" className="underline underline-offset-2">
              Termos
            </Link>{" "}
            e a{" "}
            <Link href="/privacidade" className="underline underline-offset-2">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
