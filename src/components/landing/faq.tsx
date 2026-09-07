// Perguntas + respostas factuais e curtas. Servem pro leitor E pra IA de busca
// (GEO): o mesmo conteúdo vira JSON-LD FAQPage lá embaixo.

export const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "O que é o COTOR.IA?",
    a: "O COTOR.IA é um copiloto de engenharia de prompts. Você escreve a intenção crua — o que quer que a IA faça — e o COTOR monta o prompt profissional: define persona, objetivo, contexto, restrições, formato de saída e exemplos, pontua o resultado numa rubrica técnica de 10 dimensões e otimiza em loop.",
  },
  {
    q: "O COTOR ensina a escrever prompt ou faz por mim?",
    a: "Faz por você. Diferente de guias e cursos de prompt, o COTOR entrega o prompt pronto para copiar e colar. Quando falta informação, ele pergunta antes de inventar.",
  },
  {
    q: "Como o COTOR melhora um prompt?",
    a: "Ele estrutura a intenção num objeto intermediário (o Prompt IR), pontua cada uma das 10 dimensões (clareza, contexto, objetivo, especificidade, restrições, estrutura, formato, exemplos, ambiguidade e robustez) e reescreve as dimensões fracas, mostrando o ganho de nota a cada versão.",
  },
  {
    q: "O que é o Prompt Score?",
    a: "É uma nota de 0 a 100 (com letra de A a E) calculada como média ponderada das 10 dimensões da rubrica. Não é um chute do modelo: os pesos são fixos, então a nota é consistente entre execuções e o ganho ao otimizar reflete melhoria real.",
  },
  {
    q: "O prompt gerado funciona em qualquer IA?",
    a: "Sim. O COTOR renderiza o prompt no formato certo para o modelo-alvo — genérico, Claude (XML) ou modelo de imagem (Midjourney/DALL·E) — e o texto final funciona em ChatGPT, Claude, Gemini e afins.",
  },
  {
    q: "Quais modelos de IA o COTOR usa por baixo?",
    a: "Groq (gpt-oss-120b) para análise e pontuação, e Claude Haiku 4.5 para a síntese e a otimização. O Playground roda o seu prompt num desses modelos reais para você ver a saída.",
  },
  {
    q: "Quanto custa o COTOR.IA?",
    a: "O plano Free é grátis para sempre, com 7 prompts por mês. O Starter custa R$19,90/mês (50 prompts, otimização e Playground liberados). O Pro custa R$39/mês, com geração praticamente ilimitada. O plano Team é sob consulta.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="border-b border-border/70">
      <div className="mx-auto max-w-4xl px-5 py-16 sm:py-24">
        <p className="eyebrow">Dúvidas</p>
        <h2 className="mt-4 text-3xl sm:text-4xl">Perguntas frequentes</h2>
        <dl className="mt-10 divide-y divide-border/70">
          {FAQ_ITEMS.map((item) => (
            <div key={item.q} className="py-6">
              <dt className="font-heading text-lg">{item.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
