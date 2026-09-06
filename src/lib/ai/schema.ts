import { z } from "zod";

/**
 * Prompt IR — a representação intermediária. É o coração do COTOR: guardamos
 * este objeto, não a string. Dele saem os renderers por modelo, o diff campo a
 * campo e o score consistente.
 */

export const TASK_TYPES = [
  "GENERATION",
  "ANALYSIS",
  "EXTRACTION",
  "CLASSIFICATION",
  "REWRITE",
  "CONVERSATION",
  "AGENT",
  "CODE",
  "CREATIVE",
  "IMAGE",
  "OTHER",
] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  GENERATION: "Geração",
  ANALYSIS: "Análise",
  EXTRACTION: "Extração",
  CLASSIFICATION: "Classificação",
  REWRITE: "Reescrita",
  CONVERSATION: "Conversa",
  AGENT: "Agente",
  CODE: "Código",
  CREATIVE: "Criativo",
  IMAGE: "Imagem",
  OTHER: "Outro",
};

export const promptIrSchema = z.object({
  persona: z
    .string()
    .describe("Papel/perspectiva que o modelo deve assumir. Vazio se não fizer sentido."),
  objetivo: z.string().describe("A meta única e explícita, em uma frase."),
  contexto: z
    .array(z.string())
    .describe("Fatos de fundo que o modelo precisa. Um item por fato."),
  restricoes: z
    .array(z.string())
    .describe("Limites, o que NÃO fazer, tom, tamanho, idioma."),
  passos: z
    .array(z.string())
    .describe("Decomposição da tarefa em passos, se ajudar. Pode ser vazio."),
  formatoSaida: z
    .string()
    .describe("Estrutura exata da resposta esperada (schema, exemplo de layout)."),
  exemplos: z
    .array(z.object({ entrada: z.string(), saida: z.string() }))
    .describe("Pares few-shot. Pode ser vazio."),
  criteriosSucesso: z
    .array(z.string())
    .describe("Como saber se a resposta ficou boa."),
  guardrails: z
    .array(z.string())
    .describe("O que fazer em caso de falha, ambiguidade ou input adversarial."),
});
export type PromptIR = z.infer<typeof promptIrSchema>;

export const clarifyingQuestionSchema = z.object({
  id: z.string(),
  pergunta: z.string(),
  porque: z.string().describe("Por que essa informação muda o prompt."),
  prioridade: z.number().int().min(1).max(5),
});
export type ClarifyingQuestion = z.infer<typeof clarifyingQuestionSchema>;

export const intentAnalysisSchema = z.object({
  taskType: z.enum(TASK_TYPES),
  dominio: z.string().describe("Domínio/assunto em poucas palavras."),
  idioma: z.string().describe("Idioma da resposta esperada, ex: pt-BR."),
  resumoObjetivo: z.string().describe("O que o usuário quer, reescrito com clareza."),
  premissas: z
    .array(z.string())
    .describe("Suposições que o COTOR faria pra seguir sem perguntar."),
  perguntas: z
    .array(clarifyingQuestionSchema)
    .describe("Até 5. Só o que realmente muda o resultado. Vazio se der pra seguir."),
});
export type IntentAnalysis = z.infer<typeof intentAnalysisSchema>;

export const DIMENSION_KEYS = [
  "clareza",
  "contexto",
  "objetivo",
  "especificidade",
  "restricoes",
  "estrutura",
  "formatoSaida",
  "exemplos",
  "ambiguidade",
  "robustez",
] as const;
export type DimensionKey = (typeof DIMENSION_KEYS)[number];

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  clareza: "Clareza",
  contexto: "Contexto",
  objetivo: "Objetivo",
  especificidade: "Especificidade",
  restricoes: "Restrições",
  estrutura: "Estrutura",
  formatoSaida: "Formato de saída",
  exemplos: "Exemplos",
  ambiguidade: "Ambiguidade",
  robustez: "Robustez",
};

export const dimensionScoreSchema = z.object({
  key: z.enum(DIMENSION_KEYS),
  score: z.number().int().min(0).max(10),
  evidencia: z.string().describe("Trecho do prompt que justifica a nota. '' se ausente."),
  motivo: z.string().describe("Uma frase: por que essa nota."),
  fix: z.string().describe("Ação concreta pra melhorar. '' se já está ótima."),
});
export type DimensionScore = z.infer<typeof dimensionScoreSchema>;

export const scoreResultSchema = z.object({
  overall: z.number().int().min(0).max(100),
  grade: z.enum(["A", "B", "C", "D", "E"]),
  veredito: z.string().describe("Uma linha resumindo o estado do prompt."),
  dimensoes: z.array(dimensionScoreSchema).min(1),
  porQueEssaNota: z.string(),
  oQueMelhorar: z.array(z.string()),
});
export type ScoreResult = z.infer<typeof scoreResultSchema>;

/** Templatizar — troca os específicos de um prompt concreto por {{variaveis}}. */
export const templatizeSchema = z.object({
  body: z
    .string()
    .describe("O prompt com os valores específicos trocados por {{snake_case}}."),
  variables: z
    .array(z.string())
    .describe("Nomes das variáveis criadas, em snake_case, na ordem de uso."),
});
export type TemplatizeResult = z.infer<typeof templatizeSchema>;
