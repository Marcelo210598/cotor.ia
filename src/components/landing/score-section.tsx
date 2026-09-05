"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Dim = { label: string; score: number; note?: string };

const DIMENSIONS: Dim[] = [
  { label: "Clareza", score: 9 },
  { label: "Contexto", score: 8 },
  { label: "Objetivo", score: 10 },
  { label: "Especificidade", score: 9 },
  { label: "Restrições", score: 9 },
  { label: "Estrutura", score: 10 },
  { label: "Formato de saída", score: 9 },
  { label: "Exemplos", score: 6, note: "sem par de entrada/saída" },
  { label: "Ambiguidade", score: 9 },
  { label: "Robustez", score: 8, note: "não trata CSV incompleto" },
];

const OVERALL = 91;

export function ScoreSection() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 350);
    return () => clearTimeout(t);
  }, []);

  return (
    <section id="score" className="border-b border-border/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:py-24 lg:grid-cols-[minmax(0,360px)_1fr] lg:gap-16">
        <div className="flex flex-col items-center gap-6 lg:items-start">
          <p className="eyebrow">Prompt Score</p>
          <Gauge value={OVERALL} active={visible} />
          <p className="max-w-xs text-center text-sm text-muted-foreground lg:text-left">
            Rubrica de 10 dimensões técnicas. Cada nota vem com o trecho que a
            justifica — não é pontuação inventada.
          </p>
        </div>

        <div className="flex flex-col gap-8">
          <div className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
            {DIMENSIONS.map((dim, i) => (
              <DimBar key={dim.label} dim={dim} active={visible} delay={i * 60} />
            ))}
          </div>

          <div className="grid gap-4 rounded-lg border border-border bg-card/60 p-5 sm:grid-cols-2">
            <div>
              <p className="eyebrow mb-2">por que essa nota</p>
              <p className="text-sm leading-relaxed text-foreground/85">
                Objetivo, formato e estrutura estão explícitos e sem ambiguidade.
                A persona ancora o modelo no domínio certo. Perde pontos por não
                trazer um exemplo de saída e por não dizer o que fazer quando o
                CSV vier com buracos.
              </p>
            </div>
            <div>
              <p className="eyebrow mb-2">o que melhorar</p>
              <ul className="space-y-1.5 text-sm text-foreground/85">
                <li className="flex gap-2">
                  <span className="text-coral">→</span> Incluir 1 par
                  entrada/saída como few-shot.
                </li>
                <li className="flex gap-2">
                  <span className="text-coral">→</span> Definir fallback para
                  linhas incompletas do CSV.
                </li>
              </ul>
            </div>
          </div>

          <div>
            <Button size="lg">
              Otimizar prompt
              <ArrowUpRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Gauge({ value, active }: { value: number; active: boolean }) {
  const [display, setDisplay] = useState(0);
  const R = 78;
  const C = 2 * Math.PI * R;
  const pct = active ? value / 100 : 0;

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const start = performance.now();
    const tick = (now: number) => {
      if (cancelled) return;
      const t = Math.min(1, (now - start) / 900);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * value));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return () => {
      cancelled = true;
    };
  }, [active, value]);

  return (
    <div className="relative size-52">
      <svg viewBox="0 0 200 200" className="size-full -rotate-90">
        {/* crosshair — motivo da mira */}
        <g
          stroke="var(--hairline)"
          strokeWidth="1"
          className="rotate-90 [transform-origin:center]"
        >
          <line x1="100" y1="8" x2="100" y2="34" />
          <line x1="100" y1="166" x2="100" y2="192" />
          <line x1="8" y1="100" x2="34" y2="100" />
          <line x1="166" y1="100" x2="192" y2="100" />
        </g>
        {/* ticks das 10 dimensões */}
        {DIMENSIONS.map((_, i) => {
          const a = (i / DIMENSIONS.length) * 2 * Math.PI;
          const x1 = 100 + Math.cos(a) * 92;
          const y1 = 100 + Math.sin(a) * 92;
          const x2 = 100 + Math.cos(a) * 98;
          const y2 = 100 + Math.sin(a) * 98;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--muted-foreground)"
              strokeWidth="2"
              opacity="0.5"
            />
          );
        })}
        <circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke="var(--secondary)"
          strokeWidth="10"
        />
        <circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke="var(--coral)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct)}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-5xl tabular-nums text-foreground">
          {display}
        </span>
        <span className="eyebrow mt-1 !tracking-[0.2em]">de 100 · nota A</span>
      </div>
    </div>
  );
}

function DimBar({
  dim,
  active,
  delay,
}: {
  dim: Dim;
  active: boolean;
  delay: number;
}) {
  const low = dim.score <= 6;
  return (
    <div className="flex items-center gap-3 py-0.5 text-sm">
      <span className="w-32 shrink-0 text-muted-foreground">{dim.label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700 ease-out",
            low ? "bg-muted-foreground/70" : "bg-coral/80",
          )}
          style={{
            width: active ? `${dim.score * 10}%` : "0%",
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>
      <span className="w-6 shrink-0 text-right font-mono text-xs tabular-nums text-foreground/70">
        {dim.score}
      </span>
    </div>
  );
}
