/**
 * Semeia a Galeria: roda cada intenção pelo motor real do COTOR (analyze →
 * synthesize → score) e grava como Prompt `featured` de um usuário-sistema.
 *
 *   npx tsx --env-file=.env .dev/seed-gallery.ts
 *
 * Idempotente: apaga os prompts featured do usuário-sistema e recria todos.
 * Pra crescer a galeria, é só adicionar itens em ITEMS e rodar de novo.
 */
import { prisma } from "../src/lib/db";
import {
  analyzeIntent,
  synthesizePrompt,
  scorePrompt,
  JUDGE_MODEL,
} from "../src/lib/ai/engine";
import { saveVersion } from "../src/lib/ai/store";

const SYSTEM_USER = {
  id: "cotor-galeria-system",
  name: "COTOR Galeria",
  email: "galeria@cotor.system",
};

type TT =
  | "GENERATION" | "ANALYSIS" | "EXTRACTION" | "REWRITE"
  | "CODE" | "CREATIVE" | "IMAGE" | "CONVERSATION" | "AGENT";

// `title` = o que aparece na galeria. `intent` = a tarefa-fim que alimenta o
// motor. `tt` = a categoria forçada (o analyzer às vezes joga tudo em GENERATION;
// a galeria precisa ficar equilibrada e o IMAGE precisa renderizar como prompt
// de imagem).
const ITEMS: { title: string; intent: string; tt: TT }[] = [
  { tt: "GENERATION", title: "Post de LinkedIn a partir de uma ideia solta", intent: "Escrever um post de LinkedIn envolvente a partir de uma ideia ou aprendizado solto que eu descrever" },
  { tt: "GENERATION", title: "Descrição de produto pra e-commerce", intent: "Escrever a descrição de um produto pra loja online a partir das especificações técnicas e do público-alvo" },
  { tt: "GENERATION", title: "Roteiro de Reels/Shorts a partir de bullet points", intent: "Transformar uma lista de bullet points num roteiro curto e ritmado pra um vídeo vertical de até 60 segundos" },
  { tt: "GENERATION", title: "E-mail de prospecção frio B2B", intent: "Escrever um e-mail de prospecção frio, curto e específico, pra um decisor de uma empresa, a partir do que eu vendo e da dor dele" },
  { tt: "GENERATION", title: "Brief de campanha de marketing", intent: "Montar um brief de campanha de marketing a partir do objetivo do cliente, público, canais e prazo" },

  { tt: "ANALYSIS", title: "Análise SWOT de um negócio", intent: "Fazer uma análise SWOT (forças, fraquezas, oportunidades, ameaças) de um negócio a partir de uma descrição dele" },
  { tt: "ANALYSIS", title: "Revisão de contrato: riscos e cláusulas de atenção", intent: "Ler um contrato e listar os riscos, cláusulas abusivas ou ambíguas e pontos que merecem negociação" },
  { tt: "ANALYSIS", title: "Análise de reviews de clientes", intent: "Analisar um conjunto de reviews de clientes e resumir o sentimento geral, os temas recorrentes e as reclamações mais graves" },
  { tt: "ANALYSIS", title: "Diagnóstico de funil de vendas", intent: "Diagnosticar os gargalos de um funil de vendas a partir dos números de cada etapa e sugerir onde agir primeiro" },
  { tt: "ANALYSIS", title: "Comparativo com um concorrente", intent: "Comparar meu produto com o de um concorrente e apontar vantagens, fraquezas e como me posicionar" },

  { tt: "EXTRACTION", title: "Extrair dados de nota fiscal (PDF) pra JSON", intent: "Extrair os campos de uma nota fiscal (emitente, destinatário, itens, valores, impostos, datas) e devolver em JSON estruturado" },
  { tt: "EXTRACTION", title: "Extrair campos de um currículo", intent: "Extrair de um currículo colado os dados estruturados: nome, contato, experiências, formação, habilidades e idiomas" },
  { tt: "EXTRACTION", title: "Extrair decisões e responsáveis de uma ata", intent: "Ler as notas de uma reunião e extrair as decisões tomadas, as tarefas, os responsáveis e os prazos" },
  { tt: "EXTRACTION", title: "Extrair intenção e dados de um e-mail de lead", intent: "Ler um e-mail recebido de um possível cliente e extrair contato, empresa, necessidade, urgência e próximo passo sugerido" },
  { tt: "EXTRACTION", title: "Limpar e estruturar uma tabela de specs", intent: "Transformar uma tabela de especificações de produto bagunçada e inconsistente em dados limpos e padronizados" },

  { tt: "REWRITE", title: "Deixar um texto mais formal", intent: "Reescrever um texto num tom mais formal e profissional, sem mudar o conteúdo nem o significado" },
  { tt: "REWRITE", title: "Encurtar um texto pela metade", intent: "Reduzir um texto para cerca da metade do tamanho, mantendo as informações essenciais e a clareza" },
  { tt: "REWRITE", title: "Adaptar um texto técnico pra público leigo", intent: "Reescrever um texto técnico para uma pessoa sem conhecimento na área, trocando jargão por linguagem simples e exemplos" },
  { tt: "REWRITE", title: "Corrigir e clarear um texto mal escrito", intent: "Corrigir gramática, pontuação e estrutura de um texto confuso e deixá-lo claro e fluido, preservando a voz do autor" },
  { tt: "REWRITE", title: "Reescrever no tom da marca", intent: "Reescrever um texto para o tom de voz da marca a partir de um guia de voz (adjetivos, o que evitar, exemplos)" },

  { tt: "CODE", title: "Revisar um trecho de código (bugs e melhorias)", intent: "Revisar um trecho de código e apontar bugs, riscos, problemas de legibilidade e melhorias, com sugestão de correção" },
  { tt: "CODE", title: "Gerar testes unitários pra uma função", intent: "Escrever testes unitários para uma função, cobrindo casos normais, limites e de erro, no framework indicado" },
  { tt: "CODE", title: "Explicar uma função legada linha a linha", intent: "Explicar em linguagem clara o que uma função legada faz, bloco a bloco, e apontar efeitos colaterais e pontos frágeis" },
  { tt: "CODE", title: "Escrever uma expressão regular", intent: "Escrever uma expressão regular a partir da descrição do padrão a casar, com explicação de cada parte e casos de teste" },
  { tt: "CODE", title: "Converter pseudocódigo em código real", intent: "Converter um pseudocódigo em código funcional numa linguagem escolhida, seguindo boas práticas e tratando erros" },

  { tt: "CREATIVE", title: "Nomes de marca a partir do conceito", intent: "Gerar opções de nome de marca a partir do conceito do produto, do público e do sentimento desejado, com justificativa" },
  { tt: "CREATIVE", title: "Taglines e slogans curtos", intent: "Criar taglines e slogans curtos e memoráveis para uma campanha, a partir da proposta de valor e do tom" },
  { tt: "CREATIVE", title: "Micro-conto com restrições", intent: "Escrever um micro-conto respeitando restrições dadas de tema, tom, ponto de vista e número de palavras" },
  { tt: "CREATIVE", title: "Conceito criativo de campanha", intent: "Desenvolver um conceito criativo de campanha a partir de um insight de consumidor, com ideia central e desdobramentos" },
  { tt: "CREATIVE", title: "Persona de personagem pra ficção ou jogo", intent: "Criar uma persona de personagem para ficção ou jogo: história, motivação, contradições, voz e arco possível" },

  { tt: "IMAGE", title: "Imagem de produto pra anúncio", intent: "Uma foto de produto pronta pra anúncio, com enquadramento, iluminação de estúdio, fundo e clima definidos" },
  { tt: "IMAGE", title: "Retrato estilizado a partir de descrição", intent: "Um retrato estilizado de uma pessoa a partir de descrição física, de vestimenta, de expressão e de estilo artístico" },
  { tt: "IMAGE", title: "Cena de ambiente/paisagem pra ilustração", intent: "Uma cena de ambiente ou paisagem detalhada pra ilustração, com composição, hora do dia, atmosfera e paleta" },
  { tt: "IMAGE", title: "Conceito visual de logo ou ícone de app", intent: "Um conceito visual de logo ou ícone de aplicativo a partir do nome, do setor e da personalidade da marca" },
  { tt: "IMAGE", title: "Thumbnail chamativa de vídeo do YouTube", intent: "Uma thumbnail chamativa pra vídeo do YouTube a partir do título e do gancho, com foco em contraste e rostos expressivos" },

  { tt: "CONVERSATION", title: "Assistente de suporte ao cliente", intent: "Atuar como assistente de suporte ao cliente que resolve dúvidas sobre um produto com base numa base de conhecimento, sem inventar" },
  { tt: "CONVERSATION", title: "Tutor pelo método socrático", intent: "Atuar como tutor que ensina um assunto pelo método socrático: faz perguntas que levam o aluno à resposta, sem entregá-la pronta" },
  { tt: "CONVERSATION", title: "Entrevistador técnico pra uma vaga", intent: "Atuar como entrevistador técnico para uma vaga: conduz a conversa, aprofunda respostas e avalia ao final por critérios" },
  { tt: "CONVERSATION", title: "Parceiro de brainstorm", intent: "Atuar como parceiro de brainstorm que provoca, questiona premissas e expande ideias em vez de só concordar" },
  { tt: "CONVERSATION", title: "Coach de escrita com feedback estruturado", intent: "Atuar como coach de escrita que dá feedback estruturado num texto: o que funciona, o que travou e como melhorar, por prioridade" },

  { tt: "AGENT", title: "Agente de pesquisa na web com fontes", intent: "Agir como agente que pesquisa um assunto na web, cruza fontes e entrega um resumo objetivo com as referências citadas" },
  { tt: "AGENT", title: "Agente que qualifica leads de uma lista", intent: "Agir como agente que recebe uma lista de leads e critérios de qualificação e classifica cada um com justificativa e próximo passo" },
  { tt: "AGENT", title: "Agente de revisão de código completa", intent: "Agir como agente que orquestra uma revisão de código completa: estilo, bugs, cobertura de testes, segurança e performance, com relatório final" },
  { tt: "AGENT", title: "Agente que planeja uma viagem", intent: "Agir como agente que planeja uma viagem a partir de datas, orçamento, origem e interesses: roteiro dia a dia, transporte e estimativa de custo" },
  { tt: "AGENT", title: "Agente que vira requisitos em plano de tarefas", intent: "Agir como agente que lê um documento de requisitos e produz um plano de tarefas: escopo, dependências, estimativa e ordem de execução" },
];

async function run() {
  const user = await prisma.user.upsert({
    where: { id: SYSTEM_USER.id },
    create: { ...SYSTEM_USER, emailVerified: true },
    update: {},
  });

  // gap-fill: só semeia o que ainda não existe (idempotente por título).
  // Pra recriar tudo do zero: FRESH=1 npx tsx ...
  if (process.env.FRESH) {
    await prisma.prompt.deleteMany({ where: { userId: user.id, featured: true } });
  }
  const existing = new Set(
    (
      await prisma.prompt.findMany({
        where: { userId: user.id, featured: true },
        select: { title: true },
      })
    ).map((p) => p.title),
  );
  const todo = ITEMS.filter((it) => !existing.has(it.title));
  console.log(`${existing.size} já existem, ${todo.length} a semear`);

  let ok = 0;
  let fail = 0;
  const BATCH = 2;

  for (let i = 0; i < todo.length; i += BATCH) {
    const slice = todo.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      slice.map((it) => seedOne(user.id, it)),
    );
    for (const [j, r] of results.entries()) {
      if (r.status === "fulfilled") {
        ok++;
        console.log(`✓ [${r.value.taskType}] ${slice[j].title}  (${r.value.score})`);
      } else {
        fail++;
        console.error(`✗ ${slice[j].title} — ${r.reason}`);
      }
    }
    await new Promise((res) => setTimeout(res, 1500));
  }

  console.log(`\ngaleria: ${ok} ok, ${fail} falhas de ${ITEMS.length}`);
  await prisma.$disconnect();
}

async function seedOne(
  userId: string,
  it: { title: string; intent: string; tt: TT },
) {
  const analysis = await analyzeIntent(it.intent);
  analysis.taskType = it.tt; // categoria curada, não a do analyzer
  const { ir, rendered, target } = await synthesizePrompt({
    intent: it.intent,
    analysis,
    respostas: [],
  });
  const score = await scorePrompt(rendered, { taskType: it.tt });

  const prompt = await prisma.prompt.create({
    data: {
      userId,
      title: it.title,
      intent: it.intent,
      taskType: it.tt,
      featured: true,
      tags: ["galeria"],
    },
  });

  await saveVersion({
    promptId: prompt.id,
    number: 1,
    action: "GENERATE",
    modelTarget: target,
    ir,
    rendered,
    score,
  });

  await prisma.usageEvent.create({
    data: { userId, kind: "generate", model: JUDGE_MODEL },
  });

  return { taskType: it.tt, score: `${score.overall} ${score.grade}` };
}

run().catch((e) => {
  console.error("FALHOU:", e);
  process.exit(1);
});
