import { Check } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Free",
    price: "R$0",
    cadence: "pra sempre",
    tagline: "Pra sentir o método.",
    features: [
      "10 prompts por mês",
      "Score completo nas 10 dimensões",
      "1 modelo-alvo",
      "Histórico de 7 dias",
    ],
    cta: "Começar",
    highlight: false,
  },
  {
    name: "Pro",
    price: "R$39",
    cadence: "/mês",
    tagline: "Pra quem escreve prompt todo dia.",
    features: [
      "Prompts ilimitados",
      "Loop de otimização e diff de versões",
      "Todos os modelos-alvo",
      "Playground: roda o prompt no modelo real",
      "Biblioteca com pastas e tags",
    ],
    cta: "Assinar Pro",
    highlight: true,
  },
  {
    name: "Team",
    price: "R$149",
    cadence: "/mês",
    tagline: "Pra time com padrão de prompt.",
    features: [
      "Tudo do Pro",
      "Biblioteca compartilhada e papéis",
      "Testes de regressão de prompt",
      "Acesso via API",
    ],
    cta: "Falar com a gente",
    highlight: false,
  },
];

export function Pricing() {
  return (
    <section id="planos" className="border-b border-border/70">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <p className="eyebrow">Planos</p>
        <h2 className="mt-4 text-3xl sm:text-4xl">
          Preço proporcional ao uso.
        </h2>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "flex flex-col rounded-lg border p-6",
                plan.highlight
                  ? "border-coral/40 bg-card shadow-[0_0_0_1px_rgba(255,90,95,0.15)]"
                  : "border-border bg-card/50",
              )}
            >
              <div className="flex items-baseline justify-between">
                <span className="font-heading text-lg">{plan.name}</span>
                {plan.highlight && (
                  <span className="eyebrow !tracking-[0.16em] text-coral">
                    recomendado
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-heading text-4xl tracking-tight">
                  {plan.price}
                </span>
                <span className="text-sm text-muted-foreground">
                  {plan.cadence}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {plan.tagline}
              </p>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-coral" />
                    <span className="text-foreground/85">{f}</span>
                  </li>
                ))}
              </ul>
              <LinkButton
                href="/entrar"
                size="lg"
                className="mt-6 w-full"
                variant={plan.highlight ? "default" : "outline"}
              >
                {plan.cta}
              </LinkButton>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
