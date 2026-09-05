// Só é importado por rotas/ações no servidor.
import { callHaikuJson, HAIKU_MODEL } from "./llm";
import {
  DIMENSION_KEYS,
  intentAnalysisSchema,
  promptIrSchema,
  scoreResultSchema,
  type DimensionScore,
  type IntentAnalysis,
  type PromptIR,
  type ScoreResult,
} from "./schema";
import {
  intentSystem,
  intentUser,
  synthesizeSystem,
  synthesizeUser,
  scoreSystem,
  scoreUser,
  PROMPT_VERSION,
} from "./prompts";
import { renderIR, type ModelTarget } from "./render";

export { PROMPT_VERSION };
export const JUDGE_MODEL = HAIKU_MODEL;

/** Passo 1 — lê a intenção crua, classifica e decide se precisa perguntar. */
export async function analyzeIntent(intent: string): Promise<IntentAnalysis> {
  const result = await callHaikuJson(intentAnalysisSchema, {
    system: intentSystem,
    user: intentUser(intent),
    temperature: 0.2,
    maxTokens: 1500,
  });
  // no máx 5 perguntas, ordenadas por prioridade
  result.perguntas = result.perguntas
    .sort((a, b) => a.prioridade - b.prioridade)
    .slice(0, 5);
  return result;
}

/** Passo 2 — monta o Prompt IR e renderiza pro modelo-alvo. */
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
    maxTokens: 3000,
  });
  return {
    ir,
    rendered: renderIR(ir, input.analysis.taskType, target),
    target,
  };
}

/** Passo 3 — pontua o prompt renderizado com a rubrica de 10 dimensões. */
export async function scorePrompt(
  rendered: string,
  opts?: { taskType?: string },
): Promise<ScoreResult> {
  const contexto =
    opts?.taskType === "IMAGE"
      ? "Este prompt é para um modelo de geração de imagem."
      : undefined;
  const result = await callHaikuJson(scoreResultSchema, {
    system: scoreSystem,
    user: scoreUser(rendered, contexto),
    temperature: 0,
    maxTokens: 3000,
  });
  // normaliza pra exatamente as 10 dimensões canônicas, na ordem
  const byKey = new Map(result.dimensoes.map((d) => [d.key, d]));
  result.dimensoes = DIMENSION_KEYS.map(
    (key): DimensionScore =>
      byKey.get(key) ?? {
        key,
        score: 5,
        evidencia: "",
        motivo: "Não avaliada pelo modelo.",
        fix: "",
      },
  );
  return result;
}
