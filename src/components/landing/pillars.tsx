const PILLARS: { key: string; body: string }[] = [
  { key: "Create", body: "Do rascunho vago ao prompt estruturado." },
  { key: "Optimize", body: "Loop de reescrita guiado pelo score." },
  { key: "Test", body: "Roda o prompt no modelo real e compara saídas." },
  { key: "Organize", body: "Biblioteca, pastas e histórico de versões." },
  { key: "Reuse", body: "Variáveis, templates e prompts compartilháveis." },
];

export function Pillars() {
  return (
    <section className="border-b border-border/70">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {PILLARS.map((p) => (
            <li key={p.key} className="flex flex-col gap-1.5">
              <span className="eyebrow !tracking-[0.16em] text-foreground">
                {p.key}
              </span>
              <span className="text-sm text-muted-foreground">{p.body}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
