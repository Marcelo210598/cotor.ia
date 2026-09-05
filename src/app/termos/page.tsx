import type { Metadata } from "next";
import { LegalShell } from "@/components/site/legal-shell";

export const metadata: Metadata = { title: "Termos de Uso" };

export default function TermosPage() {
  return (
    <LegalShell title="Termos de Uso" updated="5 de setembro de 2026">
      <p>
        Ao usar o COTOR.IA você concorda com o que está abaixo. É um resumo
        direto, sem letra miúda escondida.
      </p>

      <h2>O que o COTOR faz</h2>
      <p>
        O COTOR é uma ferramenta que ajuda a estruturar e pontuar prompts. Ele
        gera texto por meio de modelos de linguagem — o resultado pode conter
        erros e deve ser revisado antes de usar em produção.
      </p>

      <h2>Sua conta</h2>
      <ul>
        <li>Você precisa de uma Conta Google válida para entrar.</li>
        <li>Você é responsável pelo uso feito na sua conta.</li>
        <li>
          Não use o COTOR para gerar conteúdo ilegal, abusivo ou que viole
          direitos de terceiros.
        </li>
      </ul>

      <h2>Conteúdo</h2>
      <p>
        Os prompts que você cria são seus. Ao usar o COTOR, você nos autoriza a
        processá-los e armazená-los para operar o serviço. Podemos remover
        conteúdo que viole estes termos.
      </p>

      <h2>Planos e cobrança</h2>
      <p>
        O plano gratuito tem limites de uso. Planos pagos são cobrados de forma
        recorrente e podem ser cancelados a qualquer momento — o acesso continua
        até o fim do período já pago.
      </p>

      <h2>Sem garantias</h2>
      <p>
        O serviço é fornecido &quot;como está&quot;. Não garantimos disponibilidade
        ininterrupta nem que o resultado atenda a um objetivo específico.
      </p>

      <h2>Mudanças</h2>
      <p>
        Estes termos podem ser atualizados. Mudanças relevantes serão avisadas
        pelo app ou por e-mail.
      </p>

      <h2>Contato</h2>
      <p>
        <a
          href="mailto:contato@cotor.ia"
          className="underline underline-offset-2"
        >
          contato@cotor.ia
        </a>
      </p>
    </LegalShell>
  );
}
