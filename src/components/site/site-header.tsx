import { Wordmark } from "@/components/brand/wordmark";
import { LinkButton } from "@/components/ui/link-button";

const nav = [
  { label: "Como funciona", href: "#pipeline" },
  { label: "Prompt Score", href: "#score" },
  { label: "Planos", href: "#planos" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Wordmark />
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LinkButton href="/entrar" variant="ghost" size="sm">
            Entrar
          </LinkButton>
          <LinkButton href="/entrar" size="sm">
            Testar grátis
          </LinkButton>
        </div>
      </div>
    </header>
  );
}
