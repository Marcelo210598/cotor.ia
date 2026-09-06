// Só é importado por rotas/ações no servidor.
import {
  callHaiku,
  callGroq,
  callHaikuJson,
  callGroqJson,
  HAIKU_MODEL,
  GROQ_MODEL,
} from "./llm";
import {
  DIMENSION_KEYS,
  intentAnalysisSchema,
  promptIrSchema,
  scoreResultSchema,
  templatizeSchema,
  type DimensionScore,
  type IntentAnalysis,
  type PromptIR,
  type ScoreResult,
  type TaskType,
  type TemplatizeResult,
} from "./schema";
import {
  intentSystem,
  intentUser,
  synthesizeSystem,
  synthesizeUser,
  scoreSystem,
  scoreUser,
  optimizeSystem,
  optimizeUser,
  templatizeSystem,
  templatizeUser,
  PROMPT_VERSION,
} from "./prompts";
import { renderIR, type ModelTarget } from "./render";

export { PROMPT_VERSION };
export const SYNTH_MODEL = HAIKU_MODEL;
export const JUDGE_MODEL = GROQ_MODEL;

// self-consistency: quantas vezes pontuar antes de tirar a mediana.
// Default 1 — o free tier do Groq (8k TPM) não aguenta 3 chamadas paralelas.
// Subir p/ 3 quando o Groq for pago (env SCORE_SAMPLES).
const SCORE_SAMPLES = Math.max(
  1,
  Math.min(5, Number(process.env.SCORE_SAMPLES ?? 1)),
);

/** Passo 1 — lê a intenção crua, classifica e decide se precisa perguntar. (Groq) */
export async function analyzeIntent(intent: string): Promise<IntentAnalysis> {
  const result = await callGroqJson(intentAnalysisSchema, {
    system: intentSystem,
    user: intentUser(intent),
    temperature: 0.2,
    maxTokens: 1500,
  });
  result.perguntas = result.perguntas
    .sort((a, b) => a.prioridade - b.prioridade)
    .slice(0, 5);
  return result;
}

/** Passo 2 — monta o Prompt IR e renderiza pro modelo-alvo. (Haiku) */
export async function synthesizePrompt(input: {
  intent: string;
  analysis: IntentAnalysis;
  respostas: { pergunta: string; resposta: string }[];
  target?: ModelTarget;
}): Promise<{ ir: PromptIR; rendered: string; target: ModelTarget }> {
  const target = input.target ?? "generic";
  const ir = await callHaikuJson(promptIrSchema, {
    system: synthesizeSystem,
    user: synthesizeUser({
      intent: input.intent,
      resumoObjetivo: input.analysis.resumoObjetivo,
      taskType: input.analysis.taskType,
      idioma: input.analysis.idioma,
      premissas: input.analysis.premissas,
      respostas: input.respostas,
    }),
    temperature: 0.35,
    maxTokens: 4000,
  });
  return { ir, rendered: renderIR(ir, input.analysis.taskType, target), target };
}

/** Passo 3 — pontua com a rubrica de 10 dimensões. Groq, N amostras → mediana. */
export async function scorePrompt(
  rendered: string,
  opts?: { taskType?: string },
): Promise<ScoreResult> {
  const contexto =
    opts?.taskType === "IMAGE"
      ? "Este prompt é para um modelo de geração de imagem."
      : undefined;

  const runs = await Promise.all(
    Array.from({ length: SCORE_SAMPLES }, () =>
      callGroqJson(scoreResultSchema, {
        system: scoreSystem,
        user: scoreUser(rendered, contexto),
        temperature: SCORE_SAMPLES > 1 ? 0.2 : 0,
        maxTokens: 4000,
      }).then(normalizeDimensions),
    ),
  );

  return finalize(aggregateScores(runs));
}

/**
 * O "overall" do COTOR é uma média ponderada das 10 dimensões — não o número
 * que o judge chuta. Assim a nota é consistente entre execuções e o delta do
 * "Otimizar" reflete mudança real nas dimensões.
 */
const DIMENSION_WEIGHTS: Record<DimensionScore["key"], number> = {
  clareza: 0.12,
  contexto: 0.1,
  objetivo: 0.14,
  especificidade: 0.12,
  restricoes: 0.11,
  estrutura: 0.08,
  formatoSaida: 0.13,
  exemplos: 0.06,
  ambiguidade: 0.08,
  robustez: 0.06,
};

function finalize(r: ScoreResult): ScoreResult {
  const overall = Math.round(
    r.dimensoes.reduce(
      (acc, d) => acc + (DIMENSION_WEIGHTS[d.key] ?? 0.1) * d.score * 10,
      0,
    ),
  );
  return { ...r, overall, grade: gradeFor(overall) };
}

/** Passo 4 — reescreve o IR atacando as dimensões fracas e re-pontua. */
export async function optimizePrompt(input: {
  ir: PromptIR;
  score: ScoreResult;
  taskType: TaskType;
  target: ModelTarget;
}): Promise<{ ir: PromptIR; rendered: string; score: ScoreResult }> {
  const dimensoesFracas = input.score.dimensoes
    .filter((d) => d.score <= 7)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
    .map((d) => ({ key: d.key, score: d.score, fix: d.fix }));

  const ir = await callHaikuJson(promptIrSchema, {
    system: optimizeSystem,
    user: optimizeUser({
      taskType: input.taskType,
      irJson: JSON.stringify(input.ir),
      overall: input.score.overall,
      dimensoesFracas,
      oQueMelhorar: input.score.oQueMelhorar,
    }),
    temperature: 0.3,
    maxTokens: 4000,
  });

  const rendered = renderIR(ir, input.taskType, input.target);
  const score = await scorePrompt(rendered, { taskType: input.taskType });
  return { ir, rendered, score };
}

/**
 * Playground — roda o prompt do usuário num modelo real, como se ele tivesse
 * colado no ChatGPT. `text` é o prompt inteiro; vai como mensagem do usuário.
 */
export type PlaygroundModel = "groq" | "haiku";

export async function runPrompt(
  text: string,
  model: PlaygroundModel = "groq",
): Promise<{ output: string; model: string }> {
  const opts = { system: "", user: text, temperature: 0.7, maxTokens: 2000 };
  if (model === "haiku") {
    return { output: await callHaiku(opts), model: HAIKU_MODEL };
  }
  return { output: await callGroq(opts), model: GROQ_MODEL };
}

/** Passo 5 — transforma um prompt concreto num template com {{variaveis}}. (Haiku) */
export async function templatize(rendered: string): Promise<TemplatizeResult> {
  const result = await callHaikuJson(templatizeSchema, {
    system: templatizeSystem,
    user: templatizeUser(rendered),
    temperature: 0.2,
    maxTokens: 4000,
  });
  return result;
}

// ─────────────────────────── helpers de score ───────────────────────────

function normalizeDimensions(r: ScoreResult): ScoreResult {
  const byKey = new Map(r.dimensoes.map((d) => [d.key, d]));
  r.dimensoes = DIMENSION_KEYS.map(
    (key): DimensionScore =>
      byKey.get(key) ?? {
        key,
        score: 5,
        evidencia: "",
        motivo: "Não avaliada pelo modelo.",
        fix: "",
      },
  );
  return r;
}

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

function aggregateScores(runs: ScoreResult[]): ScoreResult {
  if (runs.length === 1) return runs[0];
  const overall = median(runs.map((r) => r.overall));
  // usa a explicação da run cuja overall está mais perto da mediana
  const base = runs.reduce((best, r) =>
    Math.abs(r.overall - overall) < Math.abs(best.overall - overall) ? r : best,
  );
  const dimensoes = DIMENSION_KEYS.map((key): DimensionScore => {
    const picks = runs
      .map((r) => r.dimensoes.find((d) => d.key === key))
      .filter((d): d is DimensionScore => !!d);
    const s = median(picks.map((p) => p.score));
    const rep =
      picks.find((p) => p.score === s) ?? picks[0] ?? base.dimensoes[0];
    return { ...rep, key, score: s };
  });
  return {
    overall,
    grade: gradeFor(overall),
    veredito: base.veredito,
    dimensoes,
    porQueEssaNota: base.porQueEssaNota,
    oQueMelhorar: base.oQueMelhorar,
  };
}

function gradeFor(n: number): ScoreResult["grade"] {
  if (n >= 85) return "A";
  if (n >= 70) return "B";
  if (n >= 55) return "C";
  if (n >= 40) return "D";
  return "E";
}
