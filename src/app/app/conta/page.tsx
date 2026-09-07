import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAccountSummary } from "@/lib/billing";
import { billingEnabled, PRO } from "@/lib/asaas";
import { ContaClient } from "./conta-client";

export const metadata = { title: "Conta" };

export default async function ContaPage() {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
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
          billingEnabled={billingEnabled}
          proPrice={PRO.price}
        />
      </div>
    </>
  );
}
