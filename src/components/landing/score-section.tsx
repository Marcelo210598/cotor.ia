"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreGauge } from "@/components/cotor/score-gauge";
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
  { label: "Exemplos", score: 6, note: "sem imagem de referência" },
  { label: "Ambiguidade", score: 9 },
  { label: "Robustez", score: 8, note: "não lista artefatos a evitar" },
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
          <ScoreGauge value={OVERALL} grade="A" run={visible} />
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
                Estilo, assunto e enquadramento estão explícitos; a luz e o fundo
                tiram a ambiguidade do resultado. Perde pontos por não trazer uma
                imagem de referência e por não dizer quais artefatos evitar
                (reflexo do estúdio, logos legíveis).
              </p>
            </div>
            <div>
              <p className="eyebrow mb-2">o que melhorar</p>
              <ul className="space-y-1.5 text-sm text-foreground/85">
                <li className="flex gap-2">
                  <span className="text-coral">→</span> Anexar 1 imagem de
                  referência de estilo.
                </li>
                <li className="flex gap-2">
                  <span className="text-coral">→</span> Listar artefatos a evitar
                  (reflexo de equipamento, texto).
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
