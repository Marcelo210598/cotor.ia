const STAGES: { n: string; title: string; body: string }[] = [
  {
    n: "01",
    title: "Intenção",
    body: "Lê o que você quer, classifica o tipo de tarefa, o domínio e o modelo-alvo.",
  },
  {
    n: "02",
    title: "Lacunas",
    body: "Aponta o que falta, o que está ambíguo e pergunta antes de inventar informação.",
  },
  {
    n: "03",
    title: "Estrutura",
    body: "Monta persona, objetivo, contexto, restrições, exemplos e formato de saída.",
  },
  {
    n: "04",
    title: "Score",
    body: "Pontua nas 10 dimensões com o trecho que justifica cada nota e explica o porquê.",
  },
  {
    n: "05",
    title: "Otimização",
    body: "Reescreve as dimensões fracas, mostra o ganho e guarda cada rodada como versão.",
  },
];

export function Pipeline() {
  return (
    <section id="pipeline" className="border-b border-border/70">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <p className="eyebrow">Como o COTOR pensa</p>
        <h2 className="mt-4 max-w-2xl text-3xl sm:text-4xl">
          Não é reescrever bonito. É engenharia, em cinco passos.
        </h2>
        <ol className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
          {STAGES.map((s) => (
            <li
              key={s.n}
              className="flex flex-col gap-3 bg-background p-5 transition-colors hover:bg-card"
            >
              <span className="font-mono text-xs text-coral">{s.n}</span>
              <span className="font-heading text-lg tracking-tight">
                {s.title}
              </span>
              <span className="text-sm leading-snug text-muted-foreground">
                {s.body}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
