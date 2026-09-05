import type { Metadata } from "next";
import { LegalShell } from "@/components/site/legal-shell";

export const metadata: Metadata = { title: "Política de Privacidade" };

export default function PrivacidadePage() {
  return (
    <LegalShell title="Política de Privacidade" updated="5 de setembro de 2026">
      <p>
        Esta política explica, em português claro, quais dados o COTOR.IA coleta e
        o que faz com eles. Se algo aqui não estiver claro, fale com a gente.
      </p>

      <h2>Que dados coletamos</h2>
      <ul>
        <li>
          <strong>Conta:</strong> seu nome, e-mail e foto de perfil, vindos do
          login com o Google. Não temos e não pedimos senha.
        </li>
        <li>
          <strong>Conteúdo:</strong> as intenções que você escreve, os prompts
          gerados, as respostas de clarificação e as notas do Prompt Score.
        </li>
        <li>
          <strong>Uso:</strong> registros de quando você gera, otimiza ou pontua
          um prompt, para controlar limites de plano.
        </li>
      </ul>

      <h2>Como usamos</h2>
      <ul>
        <li>Operar o produto — gerar, pontuar e guardar seus prompts.</li>
        <li>Aplicar os limites do seu plano e faturar, quando houver cobrança.</li>
        <li>Entender falhas e melhorar a qualidade dos prompts internos.</li>
      </ul>
      <p>
        Não vendemos seus dados e não usamos o seu conteúdo para treinar modelos.
      </p>

      <h2>Terceiros</h2>
      <p>
        Para funcionar, o COTOR envia o texto necessário para provedores de
        modelo de linguagem (Groq e Anthropic) e armazena os dados em um banco
        gerenciado (Neon) e na hospedagem (Vercel). Cada um trata os dados sob
        seus próprios termos.
      </p>

      <h2>Seus direitos</h2>
      <p>
        Você pode pedir acesso, correção ou exclusão dos seus dados a qualquer
        momento pelo e-mail de contato. A exclusão da conta remove seus prompts e
        seu histórico.
      </p>

      <h2>Contato</h2>
      <p>
        Dúvidas sobre privacidade:{" "}
        <a
          href="mailto:contato@cotor.ia"
          className="underline underline-offset-2"
        >
          contato@cotor.ia
        </a>
        .
      </p>
    </LegalShell>
  );
}
