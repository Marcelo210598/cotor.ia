/** Sintaxe de variável: {{ nome }} — letras, números e _ ; espaços em volta são opcionais. */
const VAR_RE = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

/** Nomes de variáveis únicos, na ordem em que aparecem no texto. */
export function extractVars(body: string): string[] {
  const seen = new Set<string>();
  for (const m of body.matchAll(VAR_RE)) {
    seen.add(m[1]);
  }
  return [...seen];
}

/** Substitui {{x}} pelos valores. Variável sem valor vira "{{x}}" mesmo (fica visível o que falta). */
export function fillTemplate(
  body: string,
  values: Record<string, string>,
): string {
  return body.replace(VAR_RE, (whole, name: string) => {
    const v = values[name];
    return v != null && v !== "" ? v : whole;
  });
}

/** "nome_do_cliente" → "Nome do cliente" — rótulo pro formulário. */
export function humanizeVar(name: string): string {
  const s = name.replace(/_/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
