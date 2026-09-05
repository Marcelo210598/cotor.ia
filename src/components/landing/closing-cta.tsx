import { Reticle } from "@/components/brand/reticle";
import { LinkButton } from "@/components/ui/link-button";

export function ClosingCta() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 hairline-grid opacity-40"
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 py-20 text-center sm:py-28">
        <Reticle locked className="h-10 w-10 text-foreground" />
        <h2 className="max-w-2xl text-3xl sm:text-5xl">
          Escreva a intenção. O resto é engenharia.
        </h2>
        <p className="max-w-md text-muted-foreground">
          Entra com o Google, escreve uma frase e recebe seu primeiro prompt com
          nota. Sem cartão.
        </p>
        <LinkButton href="/entrar" size="xl">
          Testar o COTOR
        </LinkButton>
      </div>
    </section>
  );
}
