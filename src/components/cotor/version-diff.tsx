import type { PromptIR } from "@/lib/ai/schema";

const STRING_FIELDS: { key: keyof PromptIR; label: string }[] = [
  { key: "persona", label: "Papel" },
  { key: "objetivo", label: "Objetivo" },
  { key: "formatoSaida", label: "Formato" },
];

const LIST_FIELDS: { key: keyof PromptIR; label: string }[] = [
  { key: "contexto", label: "Contexto" },
  { key: "passos", label: "Passos" },
  { key: "restricoes", label: "Restrições" },
  { key: "criteriosSucesso", label: "Sucesso" },
  { key: "guardrails", label: "Se falhar" },
];

function exemplosToLines(ir: PromptIR): string[] {
  return ir.exemplos.map((e) => `entrada: ${e.entrada} → saída: ${e.saida}`);
}

/** `a` = versão mais antiga, `b` = mais nova. */
export function VersionDiff({
  a,
  b,
  labelA,
  labelB,
}: {
  a: PromptIR;
  b: PromptIR;
  labelA: string;
  labelB: string;
}) {
  const rows: React.ReactNode[] = [];

  for (const { key, label } of STRING_FIELDS) {
    const av = String(a[key] ?? "").trim();
    const bv = String(b[key] ?? "").trim();
    if (av === bv) continue;
    rows.push(
      <DiffRow key={key} label={label}>
        {av ? <Line kind="del">{av}</Line> : <Empty />}
        {bv ? <Line kind="add">{bv}</Line> : <Empty />}
      </DiffRow>,
    );
  }

  for (const { key, label } of LIST_FIELDS) {
    const av = (a[key] as string[]) ?? [];
    const bv = (b[key] as string[]) ?? [];
    const removed = av.filter((x) => !bv.includes(x));
    const added = bv.filter((x) => !av.includes(x));
    if (removed.length === 0 && added.length === 0) continue;
    rows.push(
      <DiffRow key={key} label={label}>
        <div className="space-y-1">
          {removed.map((x, i) => (
            <Line key={i} kind="del">
              {x}
            </Line>
          ))}
          {added.map((x, i) => (
            <Line key={i} kind="add">
              {x}
            </Line>
          ))}
        </div>
      </DiffRow>,
    );
  }

  const exA = exemplosToLines(a);
  const exB = exemplosToLines(b);
  const exRemoved = exA.filter((x) => !exB.includes(x));
  const exAdded = exB.filter((x) => !exA.includes(x));
  if (exRemoved.length || exAdded.length) {
    rows.push(
      <DiffRow key="exemplos" label="Exemplos">
        <div className="space-y-1">
          {exRemoved.map((x, i) => (
            <Line key={i} kind="del">
              {x}
            </Line>
          ))}
          {exAdded.map((x, i) => (
            <Line key={i} kind="add">
              {x}
            </Line>
          ))}
        </div>
      </DiffRow>,
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card/40 p-4">
      <div className="mb-3 flex items-center gap-2 text-xs">
        <span className="font-mono text-muted-foreground line-through">
          {labelA}
        </span>
        <span className="text-foreground/40">→</span>
        <span className="font-mono text-coral">{labelB}</span>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma diferença estrutural entre as duas versões.
        </p>
      ) : (
        <dl className="space-y-3">{rows}</dl>
      )}
    </div>
  );
}

function DiffRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[76px_1fr] gap-3">
      <dt className="eyebrow pt-0.5 !tracking-[0.14em]">{label}</dt>
      <dd className="space-y-1 text-sm">{children}</dd>
    </div>
  );
}

function Line({
  kind,
  children,
}: {
  kind: "add" | "del";
  children: React.ReactNode;
}) {
  return (
    <p
      className={
        kind === "add"
          ? "text-foreground/90"
          : "text-muted-foreground line-through decoration-muted-foreground/50"
      }
    >
      <span className={kind === "add" ? "text-coral" : "text-muted-foreground"}>
        {kind === "add" ? "+ " : "− "}
      </span>
      {children}
    </p>
  );
}

function Empty() {
  return <p className="text-xs italic text-muted-foreground">(vazio)</p>;
}
