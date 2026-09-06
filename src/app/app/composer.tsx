"use client";

import { useState } from "react";
import { ArrowRight, Library, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Textarea } from "@/components/ui/textarea";
import { PromptResult } from "@/components/cotor/prompt-result";
import type {
  ClarifyingQuestion,
  IntentAnalysis,
  PromptIR,
  ScoreResult,
} from "@/lib/ai/schema";

type ClarifyResponse = {
  stage: "clarify";
  analysis: IntentAnalysis;
};
type ResultResponse = {
  stage: "result";
  promptId: string;
  analysis: IntentAnalysis;
  ir: PromptIR;
  rendered: string;
  target: string;
  score: ScoreResult;
};
type ApiResponse = ClarifyResponse | ResultResponse | { error: string };

const EXAMPLES = [
  "faz uma imagem de um tênis pra anúncio",
  "quero um prompt pra resumir reuniões em ata",
  "preciso extrair dados de notas fiscais em PDF",
];

export function Composer() {
  const [intent, setIntent] = useState("");
  const [phase, setPhase] = useState<"idle" | "loading" | "clarify" | "result">(
    "idle",
  );
  const [loadingLabel, setLoadingLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [promptId, setPromptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ClarifyingQuestion[]>([]);
  const [premissas, setPremissas] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ResultResponse | null>(null);
  const [version, setVersion] = useState(1);
  const [delta, setDelta] = useState<number | undefined>(undefined);
  const [optimizing, setOptimizing] = useState(false);

  async function call(payload: Record<string, unknown>): Promise<ApiResponse> {
    const res = await fetch("/api/cotor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  async function start() {
    if (intent.trim().length < 3) return;
    setError(null);
    setPhase("loading");
    setLoadingLabel("Lendo a intenção…");
    try {
      const data = await call({ intent });
      if ("error" in data) throw new Error(data.error);
      if (data.stage === "clarify") {
        setQuestions(data.analysis.perguntas);
        setPremissas(data.analysis.premissas);
        setPhase("clarify");
      } else {
        setPromptId(data.promptId);
        setResult(data);
        setPhase("result");
      }
    } catch (e) {
      setError((e as Error).message);
      setPhase("idle");
    }
  }

  async function generate(skipQuestions = false) {
    setError(null);
    setPhase("loading");
    setLoadingLabel("Montando o prompt e pontuando…");
    try {
      const data = await call({
        intent,
        skipQuestions,
        answers: skipQuestions
          ? undefined
          : questions.map((q) => ({
              id: q.id,
              pergunta: q.pergunta,
              resposta: answers[q.id] ?? "",
            })),
      });
      if ("error" in data) throw new Error(data.error);
      if (data.stage === "result") {
        setPromptId(data.promptId);
        setResult(data);
        setPhase("result");
      }
    } catch (e) {
      setError((e as Error).message);
      setPhase("clarify");
    }
  }

  async function optimize() {
    if (!promptId) return;
    setError(null);
    setOptimizing(true);
    try {
      const res = await fetch("/api/cotor/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId }),
      });
      const data = await res.json();
      if ("error" in data) throw new Error(data.error);
      setResult((prev) =>
        prev ? { ...prev, ir: data.ir, rendered: data.rendered, score: data.score } : prev,
      );
      setVersion(data.number);
      setDelta(data.delta);
      const d: number = data.delta;
      toast.success(
        d > 0
          ? `v${data.number}: +${d} pontos`
          : d === 0
            ? `v${data.number}: mesma nota`
            : `v${data.number}: ${d} pontos`,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOptimizing(false);
    }
  }

  function reset() {
    setIntent("");
    setPhase("idle");
    setPromptId(null);
    setQuestions([]);
    setPremissas([]);
    setAnswers({});
    setResult(null);
    setError(null);
    setVersion(1);
    setDelta(undefined);
  }

  if (phase === "loading") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-coral" />
        {loadingLabel}
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">intenção</p>
            <p className="text-sm text-foreground/80">{intent}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {promptId && (
              <LinkButton
                variant="ghost"
                size="sm"
                href={`/app/prompts/${promptId}`}
              >
                <Library className="size-3.5" />
                Na biblioteca
              </LinkButton>
            )}
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="size-3.5" />
              Novo
            </Button>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <PromptResult
          ir={result.ir}
          rendered={result.rendered}
          score={result.score}
          version={version}
          delta={delta}
          onOptimize={optimize}
          optimizing={optimizing}
        />
      </div>
    );
  }

  if (phase === "clarify") {
    return (
      <div className="space-y-6">
        <div>
          <p className="eyebrow">intenção</p>
          <p className="text-sm text-foreground/80">{intent}</p>
        </div>

        <div className="space-y-4">
          <p className="eyebrow">
            antes de montar, {questions.length}{" "}
            {questions.length === 1 ? "pergunta" : "perguntas"}
          </p>
          {questions.map((q) => (
            <div key={q.id} className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                {q.pergunta}
              </label>
              <p className="text-xs text-muted-foreground">{q.porque}</p>
              <Textarea
                rows={2}
                value={answers[q.id] ?? ""}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                }
                placeholder="Responde aqui — ou deixa em branco pra usar a premissa."
              />
            </div>
          ))}
        </div>

        {premissas.length > 0 && (
          <div className="rounded-lg border border-border/70 bg-card/40 p-4">
            <p className="eyebrow mb-2">premissas se você não responder</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {premissas.map((p, i) => (
                <li key={i}>— {p}</li>
              ))}
            </ul>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => generate(false)}>
            Montar o prompt
            <ArrowRight className="size-4" />
          </Button>
          <Button variant="ghost" onClick={() => generate(true)}>
            Pular e usar as premissas
          </Button>
        </div>
      </div>
    );
  }

  // idle
  return (
    <div className="space-y-4">
      <Textarea
        rows={4}
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") start();
        }}
        placeholder="O que você quer que a IA faça?"
        className="text-base"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={start} disabled={intent.trim().length < 3}>
          Fazer a engenharia
          <ArrowRight className="size-4" />
        </Button>
        <span className="text-xs text-muted-foreground">⌘/Ctrl + Enter</span>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2 pt-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => setIntent(ex)}
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-coral/40 hover:text-foreground"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
