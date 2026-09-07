import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getAccountSummary } from "@/lib/billing";
import { billingEnabled, PLANS } from "@/lib/asaas";
import { ContaClient } from "./conta-client";

export const metadata = { title: "Conta" };

export default async function ContaPage() {
  const session = await getSession();
  if (!session) redirect("/entrar");

  const summary = await getAccountSummary(session.user.id);

  return (
    <>
      <p className="eyebrow">Conta</p>
      <h1 className="mt-3 font-heading text-2xl tracking-tight">
        Plano e uso
      </h1>
      <div className="mt-8">
        <ContaClient
          summary={summary}
          email={session.user.email}
          billingEnabled={billingEnabled()}
          prices={{ STARTER: PLANS.STARTER.price, PRO: PLANS.PRO.price }}
        />
      </div>
    </>
  );
}
