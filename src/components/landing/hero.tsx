"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Reticle } from "@/components/brand/reticle";
import { LinkButton } from "@/components/ui/link-button";
import { cn } from "@/lib/utils";

const VAGUE = "faz uma imagem de um tênis pra anúncio";

const STRUCTURED: { label: string; value: string }[] = [
  {
    label: "Estilo",
    value:
      "Fotografia de produto, still life comercial, lente ~50 mm, foco nítido de ponta a ponta.",
  },
  {
    label: "Assunto",
    value:
      "Tênis de corrida branco com detalhes em coral, vista 3/4, levemente suspenso no ar.",
  },
  {
    label: "Cena",
    value:
      "Fundo cinza-claro em gradiente, sombra difusa embaixo, um respingo de água congelado.",
  },
  {
    label: "Luz",
    value:
      "Softbox grande a 45° pela esquerda como luz principal, rim light fraco por trás.",
  },
  {
    label: "Restrições",
    value:
      "Sem pessoas, sem texto, sem logo legível, sem marca-d'água. Cores fiéis ao produto.",
  },
  {
    label: "Formato",
    value: "Quadrado 1:1, 2048 px, sem borda — pronto pro feed.",
  },
];

const MQ = "(prefers-reduced-motion: reduce)";

function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(MQ);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(MQ).matches,
    () => false,
  );
}

export function Hero() {
  const reduced = useReducedMotion();
  const [typed, setTyped] = useState("");
  const [locked, setLocked] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const [score, setScore] = useState(23);

  useEffect(() => {
    if (reduced) {
      // estado final, sem animação
      const id = setTimeout(() => {
        setTyped(VAGUE);
        setLocked(true);
        setRevealed(STRUCTURED.length);
        setScore(91);
      }, 0);
      return () => clearTimeout(id);
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    // 1. digita o prompt vago
    for (let i = 1; i <= VAGUE.length; i++) {
      timers.push(setTimeout(() => setTyped(VAGUE.slice(0, i)), 260 + i * 34));
    }
    const afterType = 260 + VAGUE.length * 34;
    // 2. a mira trava
    timers.push(setTimeout(() => setLocked(true), afterType + 260));
    // 3. blocos entram em cascata
    for (let i = 1; i <= STRUCTURED.length; i++) {
      timers.push(setTimeout(() => setRevealed(i), afterType + 520 + i * 220));
    }
    // 4. score sobe 23 -> 91
    const scoreStart = afterType + 520 + STRUCTURED.length * 220;
    for (let s = 24; s <= 91; s++) {
      timers.push(setTimeout(() => setScore(s), scoreStart + (s - 23) * 12));
    }
    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  return (
    <section className="relative overflow-hidden border-b border-border/70">
      <div
        className="pointer-events-none absolute inset-0 hairline-grid opacity-[0.5]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-[-10%] h-[420px] w-[820px] -translate-x-1/2 rounded-full opacity-25 blur-[120px]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(255,90,95,0.35), transparent)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-14 sm:pt-24 sm:pb-20">
        <p className="eyebrow">Copiloto de engenharia de prompts</p>
        <h1 className="mt-4 max-w-3xl text-balance text-4xl leading-[1.05] sm:text-6xl">
          Você escreve a intenção.
          <br />O COTOR faz a{" "}
          <span className="text-coral">engenharia</span>.
        </h1>
        <p className="mt-5 max-w-xl text-pretty text-muted-foreground sm:text-lg">
          Ele identifica o objetivo, pergunta o que falta, monta a estrutura
          profissional e devolve um prompt com nota técnica — pronto pra colar no
          modelo.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <LinkButton href="/entrar" size="xl">
            Testar grátis
          </LinkButton>
          <LinkButton href="#pipeline" size="xl" variant="outline">
            Ver como funciona
          </LinkButton>
        </div>

        <p className="eyebrow mt-7 !tracking-[0.2em]">
          Create <span className="text-coral/60">·</span> Optimize{" "}
          <span className="text-coral/60">·</span> Test{" "}
          <span className="text-coral/60">·</span> Organize{" "}
          <span className="text-coral/60">·</span> Reuse
        </p>

        {/* transformação antes → depois */}
        <div className="mt-14 grid items-center gap-4 lg:grid-cols-[1fr_auto_1.35fr]">
          {/* ANTES */}
          <figure className="rounded-lg border border-border bg-card/60 p-4">
            <figcaption className="eyebrow mb-3">o que você digita</figcaption>
            <p className="min-h-[4.5rem] font-mono text-sm text-foreground/90">
              {typed}
              {!reduced && typed.length < VAGUE.length && (
                <span className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[2px] animate-pulse bg-coral align-middle" />
              )}
            </p>
            <ScoreLine value={23} grade="E" tone="weak" />
          </figure>

          {/* mira */}
          <div className="flex justify-center py-2 lg:py-0">
            <Reticle
              locked={locked}
              className={cn(
                "h-9 w-9 text-muted-foreground transition-all duration-500",
                locked && "scale-110 text-foreground",
              )}
            />
          </div>

          {/* DEPOIS */}
          <figure className="rounded-lg border border-border bg-card p-4 shadow-[0_0_0_1px_rgba(255,90,95,0.12),0_24px_60px_-30px_rgba(0,0,0,0.8)]">
            <figcaption className="eyebrow mb-3">
              o que o modelo precisava
            </figcaption>
            <dl className="space-y-2.5">
              {STRUCTURED.map((block, i) => (
                <div
                  key={block.label}
                  className={cn(
                    "grid grid-cols-[84px_1fr] gap-3 transition-all duration-500",
                    i < revealed
                      ? "translate-y-0 opacity-100"
                      : "translate-y-1.5 opacity-0",
                  )}
                >
                  <dt className="eyebrow pt-0.5 !tracking-[0.16em]">
                    {block.label}
                  </dt>
                  <dd className="text-sm leading-snug text-foreground/90">
                    {block.value}
                  </dd>
                </div>
              ))}
            </dl>
            <ScoreLine value={score} grade={score >= 85 ? "A" : "B"} tone="strong" />
          </figure>
        </div>
      </div>
    </section>
  );
}

function ScoreLine({
  value,
  grade,
  tone,
}: {
  value: number;
  grade: string;
  tone: "weak" | "strong";
}) {
  return (
    <div className="mt-4 flex items-center gap-3 border-t border-border/70 pt-3">
      <span className="eyebrow !tracking-[0.16em]">score</span>
      <span
        className={cn(
          "font-mono text-lg tabular-nums",
          tone === "strong" ? "text-coral" : "text-muted-foreground",
        )}
      >
        {value}
        <span className="text-muted-foreground">/100</span>
      </span>
      <span className="rounded border border-border px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
        {grade}
      </span>
      <div className="ml-auto h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300",
            tone === "strong" ? "bg-coral" : "bg-muted-foreground/60",
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
