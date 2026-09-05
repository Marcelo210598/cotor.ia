import type { PromptIR, TaskType } from "./schema";

export type ModelTarget = "generic" | "claude" | "gpt";

/**
 * Renderiza o Prompt IR pro texto que o usuário cola no modelo-alvo.
 * O IR é a fonte da verdade; cada alvo tem seu dialeto. IMAGE sai como prompt
 * de modelo de imagem (parágrafo denso + negative + parâmetros), não markdown.
 */
export function renderIR(
  ir: PromptIR,
  taskType: TaskType,
  target: ModelTarget = "generic",
): string {
  if (taskType === "IMAGE") return renderImage(ir);
  return target === "claude" ? renderClaude(ir) : renderGeneric(ir);
}

function renderImage(ir: PromptIR): string {
  const clean = (s: string) => s.trim().replace(/[.\s]+$/, "");
  const parts = [clean(ir.objetivo), ...ir.contexto.map(clean)].filter(Boolean);
  if (ir.formatoSaida) parts.push(clean(ir.formatoSaida));
  let out = parts.join(". ") + ".";
  if (ir.restricoes.length) {
    out += `\n\nEvitar (negative prompt): ${ir.restricoes.map(clean).join(", ")}.`;
  }
  return out;
}

function list(items: string[]): string {
  return items.map((i) => `- ${i}`).join("\n");
}

function renderGeneric(ir: PromptIR): string {
  const out: string[] = [];
  if (ir.persona) out.push(`# Papel\n${ir.persona}`);
  out.push(`# Objetivo\n${ir.objetivo}`);
  if (ir.contexto.length) out.push(`# Contexto\n${list(ir.contexto)}`);
  if (ir.passos.length) out.push(`# Passos\n${list(ir.passos)}`);
  if (ir.restricoes.length) out.push(`# Restrições\n${list(ir.restricoes)}`);
  out.push(`# Formato da resposta\n${ir.formatoSaida}`);
  if (ir.exemplos.length) {
    const ex = ir.exemplos
      .map((e, i) => `## Exemplo ${i + 1}\nEntrada:\n${e.entrada}\nSaída:\n${e.saida}`)
      .join("\n\n");
    out.push(`# Exemplos\n${ex}`);
  }
  if (ir.criteriosSucesso.length)
    out.push(`# Critérios de sucesso\n${list(ir.criteriosSucesso)}`);
  if (ir.guardrails.length)
    out.push(`# Se algo der errado\n${list(ir.guardrails)}`);
  return out.join("\n\n");
}

function renderClaude(ir: PromptIR): string {
  const out: string[] = [];
  if (ir.persona) out.push(ir.persona);
  out.push(`<objetivo>\n${ir.objetivo}\n</objetivo>`);
  if (ir.contexto.length)
    out.push(`<contexto>\n${list(ir.contexto)}\n</contexto>`);
  if (ir.passos.length) out.push(`<passos>\n${list(ir.passos)}\n</passos>`);
  if (ir.restricoes.length)
    out.push(`<restricoes>\n${list(ir.restricoes)}\n</restricoes>`);
  out.push(`<formato_da_resposta>\n${ir.formatoSaida}\n</formato_da_resposta>`);
  if (ir.exemplos.length) {
    const ex = ir.exemplos
      .map(
        (e) =>
          `<exemplo>\n<entrada>\n${e.entrada}\n</entrada>\n<saida>\n${e.saida}\n</saida>\n</exemplo>`,
      )
      .join("\n");
    out.push(`<exemplos>\n${ex}\n</exemplos>`);
  }
  if (ir.criteriosSucesso.length)
    out.push(
      `<criterios_de_sucesso>\n${list(ir.criteriosSucesso)}\n</criterios_de_sucesso>`,
    );
  if (ir.guardrails.length)
    out.push(`<se_algo_der_errado>\n${list(ir.guardrails)}\n</se_algo_der_errado>`);
  return out.join("\n\n");
}
