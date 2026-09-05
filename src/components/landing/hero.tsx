"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Reticle } from "@/components/brand/reticle";
import { LinkButton } from "@/components/ui/link-button";
import { cn } from "@/lib/utils";

type Example = {
  vague: string;
  weak: number;
  strong: number;
  grade: string;
  structured: { label: string; value: string }[];
};

const EXAMPLES: Example[] = [
  {
    vague: "faz uma imagem de um tênis pra anúncio",
    weak: 23,
    strong: 91,
    grade: "A",
    structured: [
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
          "Softbox grande a 45° pela esquerda como principal, rim light fraco por trás.",
      },
      {
        label: "Restrições",
        value:
          "Sem pessoas, sem texto, sem logo legível, sem marca-d'água. Cores fiéis ao produto.",
      },
      { label: "Formato", value: "Quadrado 1:1, 2048 px, sem borda — pronto pro feed." },
    ],
  },
  {
    vague: "resume essa reunião pra virar ata",
    weak: 28,
    strong: 88,
    grade: "A",
    structured: [
      {
        label: "Persona",
        value: "Secretária executiva que produz atas corporativas objetivas.",
      },
      {
        label: "Objetivo",
        value:
          "Transformar a transcrição em ata: decisões, responsáveis e prazos, sem digressão.",
      },
      {
        label: "Contexto",
        value: "Reunião de time · transcrição bruta anexada · tom formal e neutro.",
      },
      {
        label: "Restrições",
        value:
          "Não inferir o que não foi dito. Marcar 'a definir' quando faltar responsável.",
      },
      {
        label: "Formato",
        value:
          "Cabeçalho + resumo por tópico + tabela (ação · responsável · prazo) + próxima reunião.",
      },
    ],
  },
  {
    vague: "escreve um e-mail cobrando um cliente",
    weak: 31,
    strong: 87,
    grade: "A",
    structured: [
      {
        label: "Persona",
        value: "Analista financeiro de uma PME, cordial e firme.",
      },
      {
        label: "Objetivo",
        value:
          "Cobrar uma fatura vencida há 8 dias e propor um prazo curto de regularização.",
      },
      {
        label: "Contexto",
        value:
          "Cliente recorrente, bom histórico · valor R$ 2.400 · 1º lembrete, ainda sem juros.",
      },
      {
        label: "Tom",
        value: "Respeitoso, direto, sem ameaça. Assume que foi um esquecimento.",
      },
      {
        label: "Formato",
        value: "Assunto + 3 parágrafos curtos + linha com PIX e vencimento. Máx 120 palavras.",
      },
    ],
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
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [locked, setLocked] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const [score, setScore] = useState(EXAMPLES[0].weak);
  const [out, setOut] = useState(false);

  const ex = EXAMPLES[idx];

  // um único loop dono de todo o ciclo; nada de re-disparar o effect
  useEffect(() => {
    let cancelled = false;
    const t: ReturnType<typeof setTimeout>[] = [];
    const at = (fn: () => void, ms: number) => {
      t.push(setTimeout(() => !cancelled && fn(), ms));
    };

    function play(i: number) {
      if (cancelled) return;
      const e = EXAMPLES[i];
      setIdx(i);
      setTyped("");
      setLocked(false);
      setRevealed(0);
      setScore(e.weak);
      setOut(false);

      if (reduced) {
        setTyped(e.vague);
        setLocked(true);
        setRevealed(e.structured.length);
        setScore(e.strong);
        return; // sem rotação
      }

      for (let c = 1; c <= e.vague.length; c++) {
        at(() => setTyped(e.vague.slice(0, c)), 200 + c * 30);
      }
      const afterType = 200 + e.vague.length * 30;
      at(() => setLocked(true), afterType + 220);
      for (let b = 1; b <= e.structured.length; b++) {
        at(() => setRevealed(b), afterType + 440 + b * 190);
      }
      const scoreStart = afterType + 440 + e.structured.length * 190;
      for (let s = e.weak + 1; s <= e.strong; s++) {
        at(() => setScore(s), scoreStart + (s - e.weak) * 11);
      }
      const settled = scoreStart + (e.strong - e.weak) * 11;
      at(() => setOut(true), settled + 2600);
      at(() => play((i + 1) % EXAMPLES.length), settled + 3100);
    }

    t.push(setTimeout(() => play(0), 0));
    return () => {
      cancelled = true;
      t.forEach(clearTimeout);
    };
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
          <br />O COTOR faz a <span className="text-coral">engenharia</span>.
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

        {/* transformação antes → depois (cicla exemplos) */}
        <div
          className={cn(
            "mt-14 grid items-center gap-4 transition-opacity duration-500 lg:grid-cols-[1fr_auto_1.35fr]",
            out ? "opacity-0" : "opacity-100",
          )}
        >
          {/* ANTES */}
          <figure className="rounded-lg border border-border bg-card/60 p-4">
            <figcaption className="eyebrow mb-3">o que você digita</figcaption>
            <p className="min-h-[4.5rem] font-mono text-sm text-foreground/90">
              {typed}
              {!reduced && typed.length < ex.vague.length && (
                <span className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[2px] animate-pulse bg-coral align-middle" />
              )}
            </p>
            <ScoreLine value={ex.weak} grade="E" tone="weak" />
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
            <figcaption className="eyebrow mb-3">o que o modelo precisava</figcaption>
            <dl className="space-y-2.5">
              {ex.structured.map((block, i) => (
                <div
                  key={block.label}
                  className={cn(
                    "grid grid-cols-[84px_1fr] gap-3 transition-all duration-500",
                    i < revealed
                      ? "translate-y-0 opacity-100"
                      : "translate-y-1.5 opacity-0",
                  )}
                >
                  <dt className="eyebrow pt-0.5 !tracking-[0.16em]">{block.label}</dt>
                  <dd className="text-sm leading-snug text-foreground/90">
                    {block.value}
                  </dd>
                </div>
              ))}
            </dl>
            <ScoreLine value={score} grade={ex.grade} tone="strong" />
          </figure>
        </div>

        {/* indicador de exemplo */}
        <div className="mt-4 flex justify-center gap-1.5 lg:justify-start">
          {EXAMPLES.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                i === idx ? "w-6 bg-coral" : "w-1.5 bg-muted-foreground/40",
              )}
            />
          ))}
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
