import { DIMENSION_LABELS, type ScoreResult } from "@/lib/ai/schema";
import { ScoreGauge } from "@/components/cotor/score-gauge";
import { cn } from "@/lib/utils";

export function ScoreCard({
  score,
  delta,
}: {
  score: ScoreResult;
  /** variação vs. versão anterior, se houver */
  delta?: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/60 p-5">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
        <ScoreGauge value={score.overall} grade={score.grade} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="eyebrow">Prompt Score</span>
            {typeof delta === "number" && delta !== 0 && (
              <span
                className={cn(
                  "font-mono text-xs tabular-nums",
                  delta > 0 ? "text-coral" : "text-muted-foreground",
                )}
              >
                {delta > 0 ? `+${delta}` : delta} vs. versão anterior
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-foreground/80">{score.veredito}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {score.dimensoes.map((d) => (
          <div key={d.key} className="flex items-center gap-3 text-sm">
            <span className="w-32 shrink-0 text-muted-foreground">
              {DIMENSION_LABELS[d.key] ?? d.key}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full rounded-full",
                  d.score <= 5 ? "bg-muted-foreground/70" : "bg-coral/80",
                )}
                style={{ width: `${d.score * 10}%` }}
              />
            </div>
            <span className="w-5 shrink-0 text-right font-mono text-xs tabular-nums text-foreground/70">
              {d.score}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 border-t border-border/70 pt-4 sm:grid-cols-2">
        <div>
          <p className="eyebrow mb-2">por que essa nota</p>
          <p className="text-sm leading-relaxed text-foreground/80">
            {score.porQueEssaNota}
          </p>
        </div>
        <div>
          <p className="eyebrow mb-2">o que melhorar</p>
          <ul className="space-y-1.5 text-sm text-foreground/80">
            {score.oQueMelhorar.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-coral">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
