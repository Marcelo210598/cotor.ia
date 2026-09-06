"use client";

import { useState } from "react";
import { Loader2, Play, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Model = "groq" | "haiku";

const MODEL_LABEL: Record<Model, string> = {
  groq: "Rápido",
  haiku: "Claude Haiku",
};

/**
 * Roda o prompt num modelo real, como se o usuário tivesse colado no ChatGPT.
 * `disabled` p/ prompts de imagem (não dá pra gerar imagem aqui).
 */
export function PlaygroundPanel({
  text,
  disabled = false,
  disabledReason = "Prompt de imagem — cola direto no Midjourney / DALL·E / Flux.",
}: {
  text: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [model, setModel] = useState<Model>("groq");
  const [output, setOutput] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, model }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falhou");
      setOutput(data.output);
    } catch (e) {
      setError((e as Error).message);
      toast.error((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  if (disabled) {
    return (
      <div className="rounded-lg border border-border/70 bg-card/40 p-4">
        <p className="eyebrow mb-1.5">testar</p>
        <p className="text-sm text-muted-foreground">{disabledReason}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="eyebrow">testar</p>
          <div className="flex gap-1">
            {(Object.keys(MODEL_LABEL) as Model[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModel(m)}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-xs transition-colors",
                  model === m
                    ? "border-coral/40 bg-coral/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {MODEL_LABEL[m]}
              </button>
            ))}
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={run} disabled={running}>
          {running ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : output ? (
            <RotateCw className="size-3.5" />
          ) : (
            <Play className="size-3.5" />
          )}
          {running ? "Rodando…" : output ? "Rodar de novo" : "Rodar o prompt"}
        </Button>
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {output !== null && (
        <div className="mt-3">
          <p className="eyebrow mb-1.5">saída do modelo</p>
          <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-background/60 p-3 text-[0.8rem] leading-relaxed text-foreground/90">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
