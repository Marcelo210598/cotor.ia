"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScoreCard } from "@/components/cotor/score-card";
import type { PromptIR, ScoreResult } from "@/lib/ai/schema";

type Block = { label: string; lines: string[] };

function irBlocks(ir: PromptIR, skipGuardrails = false): Block[] {
  const b: Block[] = [];
  if (ir.persona) b.push({ label: "Papel", lines: [ir.persona] });
  b.push({ label: "Objetivo", lines: [ir.objetivo] });
  if (ir.contexto.length) b.push({ label: "Contexto", lines: ir.contexto });
  if (ir.passos.length) b.push({ label: "Passos", lines: ir.passos });
  if (ir.restricoes.length) b.push({ label: "Restrições", lines: ir.restricoes });
  b.push({ label: "Formato", lines: [ir.formatoSaida] });
  if (ir.exemplos.length)
    b.push({
      label: "Exemplos",
      lines: ir.exemplos.map(
        (e, i) => `${i + 1}. entrada: ${e.entrada} → saída: ${e.saida}`,
      ),
    });
  if (ir.criteriosSucesso.length)
    b.push({ label: "Sucesso", lines: ir.criteriosSucesso });
  if (!skipGuardrails && ir.guardrails.length)
    b.push({ label: "Se falhar", lines: ir.guardrails });
  return b;
}

export function PromptResult({
  ir,
  rendered,
  score,
  version = 1,
  delta,
  taskType,
  onOptimize,
  optimizing = false,
}: {
  ir: PromptIR;
  rendered: string;
  score: ScoreResult;
  version?: number;
  delta?: number;
  taskType?: string;
  onOptimize?: () => void;
  optimizing?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  // No IMAGE, guardrails não vão pro prompt — são avisos pro usuário.
  const warnings = taskType === "IMAGE" ? ir.guardrails : [];

  async function copy() {
    try {
      await navigator.clipboard.writeText(rendered);
      setCopied(true);
      toast.success("Prompt copiado.");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Não consegui copiar. Seleciona e copia na mão.");
    }
  }

  return (
    <div className="space-y-6">
      {warnings.length > 0 && (
        <div className="rounded-lg border border-coral/30 bg-coral/[0.06] p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <TriangleAlert className="size-4 text-coral" />
            Antes de usar
          </p>
          <ul className="space-y-1.5 text-sm text-foreground/80">
            {warnings.map((w, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-coral">→</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="eyebrow">o prompt · v{version}</p>
            <Button size="sm" variant="outline" onClick={copy}>
              {copied ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-border bg-card p-4 font-mono text-[0.8rem] leading-relaxed text-foreground/90">
            {rendered}
          </pre>
          <div className="rounded-lg border border-border/70 bg-card/40 p-4">
            <p className="eyebrow mb-3">estrutura</p>
            <dl className="space-y-2.5">
              {irBlocks(ir, warnings.length > 0).map((block) => (
                <div
                  key={block.label}
                  className="grid grid-cols-[76px_1fr] gap-3"
                >
                  <dt className="eyebrow pt-0.5 !tracking-[0.14em]">
                    {block.label}
                  </dt>
                  <dd className="space-y-1 text-sm text-foreground/85">
                    {block.lines.map((l, i) => (
                      <p key={i}>{l}</p>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <ScoreCard score={score} delta={delta} />
      </div>

      {onOptimize && (
        <div className="flex items-center gap-3">
          <Button onClick={onOptimize} disabled={optimizing}>
            {optimizing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {optimizing ? "Otimizando…" : "Otimizar prompt"}
          </Button>
          <span className="text-xs text-muted-foreground">
            reescreve as dimensões fracas e gera a v{version + 1}
          </span>
        </div>
      )}
    </div>
  );
}
