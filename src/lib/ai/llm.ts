// Só é importado por rotas/ações no servidor. Nunca importe de Client Component.
import Anthropic from "@anthropic-ai/sdk";
import Groq from "groq-sdk";
import { z } from "zod";

/**
 * Camada de modelo do COTOR. Dois provedores:
 *  - Haiku (Anthropic) — síntese e judge: melhor escrita e JSON, barato o suficiente.
 *  - Groq (qwen3 / gpt-oss) — tarefas de classificação rápidas; é a alavanca de
 *    custo pra Fase 5. Já plugado, ainda não no caminho crítico.
 */

export const HAIKU_MODEL = "claude-haiku-4-5";
export const GROQ_MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";

let _anthropic: Anthropic | null = null;
function anthropic() {
  if (!_anthropic) _anthropic = new Anthropic();
  return _anthropic;
}

let _groq: Groq | null = null;
function groq() {
  if (!_groq) _groq = new Groq();
  return _groq;
}

export class LlmError extends Error {}

type CallOpts = {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
};

export async function callHaiku({
  system,
  user,
  maxTokens = 4000,
  temperature = 0.3,
}: CallOpts): Promise<string> {
  try {
    const res = await anthropic().messages.create({
      model: HAIKU_MODEL,
      max_tokens: maxTokens,
      temperature,
      system,
      messages: [{ role: "user", content: user }],
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    if (!text) throw new LlmError("Haiku retornou resposta vazia.");
    return text;
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      throw new LlmError(`Haiku ${err.status ?? ""}: ${err.message}`);
    }
    throw err;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function callGroq(
  { system, user, maxTokens = 4000, temperature = 0.3 }: CallOpts,
  jsonMode = false,
): Promise<string> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await groq().chat.completions.create({
        model: GROQ_MODEL,
        max_tokens: maxTokens,
        temperature,
        ...(jsonMode
          ? { response_format: { type: "json_object" as const } }
          : {}),
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });
      const text = res.choices[0]?.message?.content ?? "";
      if (!text) throw new LlmError("Groq retornou resposta vazia.");
      return text;
    } catch (err) {
      const msg = (err as Error).message ?? "";
      // rate limit: espera o tempo sugerido (até 12s) e tenta 1× de novo
      if (attempt === 0 && /429|rate_limit/i.test(msg)) {
        const m = msg.match(/try again in ([\d.]+)s/i);
        const wait = Math.min(12000, m ? Number(m[1]) * 1000 + 500 : 6000);
        await sleep(wait);
        continue;
      }
      throw new LlmError(`Groq: ${msg}`);
    }
  }
  throw new LlmError("Groq: rate limit persistente.");
}

/** Extrai o primeiro objeto JSON de uma resposta (tolera cercas ```json e texto ao redor). */
export function extractJson(raw: string): unknown {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new LlmError("Resposta do modelo não continha JSON.");
  }
  try {
    return JSON.parse(s.slice(start, end + 1));
  } catch {
    throw new LlmError("JSON do modelo é inválido.");
  }
}

const JSON_HINT =
  "\n\nResponda APENAS com um único objeto JSON válido, sem texto antes ou depois, sem comentários.";

async function callJson<T>(
  schema: z.ZodType<T>,
  opts: CallOpts,
  run: (o: CallOpts) => Promise<string>,
): Promise<T> {
  const withHint = { ...opts, system: opts.system + JSON_HINT };
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await run(withHint);
    try {
      return schema.parse(extractJson(raw));
    } catch (err) {
      if (attempt === 1) {
        throw new LlmError(
          `Não consegui estruturar a resposta do modelo: ${(err as Error).message}`,
        );
      }
    }
  }
  throw new LlmError("inalcançável");
}

/** Chama Haiku pedindo JSON e valida contra o schema. 1 retry em falha de parse. */
export function callHaikuJson<T>(schema: z.ZodType<T>, opts: CallOpts) {
  return callJson(schema, opts, callHaiku);
}

/** Chama Groq (JSON mode) e valida contra o schema. Mais rápido/barato que o Haiku. */
export function callGroqJson<T>(schema: z.ZodType<T>, opts: CallOpts) {
  return callJson(schema, opts, (o) => callGroq(o, true));
}
