"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * O gauge-mira: eco do "O" da logo. Arco coral preenche até a nota, ticks ao
 * redor = as 10 dimensões, crosshair no fundo. É a assinatura visual do score.
 */
export function ScoreGauge({
  value,
  grade,
  run = true,
  size = "lg",
  ticks = 10,
}: {
  value: number;
  grade?: string;
  /** dispara a animação de contagem; false = fica zerado (útil ao entrar por scroll) */
  run?: boolean;
  size?: "sm" | "lg";
  ticks?: number;
}) {
  const [display, setDisplay] = useState(0);
  const R = 78;
  const C = 2 * Math.PI * R;
  const pct = run ? value / 100 : 0;

  useEffect(() => {
    if (!run) return;
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
  }, [run, value]);

  const px = size === "lg" ? "size-52" : "size-32";
  const numCls =
    size === "lg" ? "font-heading text-5xl" : "font-heading text-3xl";

  return (
    <div className={cn("relative", px)}>
      <svg viewBox="0 0 200 200" className="size-full -rotate-90">
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
        {Array.from({ length: ticks }).map((_, i) => {
          const a = (i / ticks) * 2 * Math.PI;
          return (
            <line
              key={i}
              x1={100 + Math.cos(a) * 92}
              y1={100 + Math.sin(a) * 92}
              x2={100 + Math.cos(a) * 98}
              y2={100 + Math.sin(a) * 98}
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
          style={{
            transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn(numCls, "leading-none tabular-nums text-foreground")}>
          {display}
        </span>
        <span
          className={cn(
            "eyebrow mt-1 whitespace-nowrap !tracking-[0.16em]",
            size === "sm" && "!text-[0.55rem]",
          )}
        >
          {size === "lg" ? "de 100" : "/100"}
          {grade ? ` · ${grade}` : ""}
        </span>
      </div>
    </div>
  );
}
