"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AccountSummary } from "@/lib/billing";

type PaidPlan = "STARTER" | "PRO";

const PLAN_LABEL: Record<AccountSummary["plan"], string> = {
  FREE: "Free",
  STARTER: "Starter",
  PRO: "Pro",
  TEAM: "Team",
};

const PERKS: Record<PaidPlan, string[]> = {
  STARTER: [
    "50 gerações por mês",
    "Otimizar + diff de versões liberado",
    "Playground: roda o prompt no modelo real",
    "Todos os modelos-alvo",
  ],
  PRO: [
    "Geração praticamente ilimitada (300/dia)",
    "Galeria de prompts prontos por categoria",
    "Tudo do Starter, sem cota mensal",
  ],
};

function maskCpf(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function fmtPrice(n: number): string {
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: n % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function ContaClient({
  summary,
  billingEnabled,
  prices,
}: {
  summary: AccountSummary;
  email: string;
  billingEnabled: boolean;
  prices: Record<PaidPlan, number>;
}) {
  const router = useRouter();
  const { plan, subscription, generateQuota, usage30d } = summary;

  const [cpf, setCpf] = useState("");
  const [loadingPlan, setLoadingPlan] = useState<PaidPlan | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  const isPaid = plan === "STARTER" || plan === "PRO" || plan === "TEAM";
  const pending = subscription?.status === "PENDING";
  const pastDue = subscription?.status === "PAST_DUE";
  const canceled = subscription?.status === "CANCELED";

  // quem pode assinar/trocar pela tela: Free e Starter (Team fala com a gente)
  const offer: PaidPlan[] =
    plan === "FREE" ? ["STARTER", "PRO"] : plan === "STARTER" ? ["PRO"] : [];

  const used = usage30d.generate;
  const pct = Math.min(100, Math.round((used / generateQuota.max) * 100));

  async function subscribe(target: PaidPlan) {
    const digits = cpf.replace(/\D/g, "");
    if (digits.length !== 11 && digits.length !== 14) {
      toast.error("Digita um CPF (ou CNPJ) válido.");
      return;
    }
    setLoadingPlan(target);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpfCnpj: digits, plan: target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falhou");
      if (data.switched) {
        toast.success(
          `Plano trocado pro ${data.plan === "PRO" ? "Pro" : "Starter"}. O novo valor entra na próxima cobrança.`,
        );
        router.refresh();
        setLoadingPlan(null);
        return;
      }
      window.location.assign(data.invoiceUrl);
    } catch (e) {
      toast.error((e as Error).message);
      setLoadingPlan(null);
    }
  }

  async function openInvoice() {
    setLoadingInvoice(true);
    try {
      const res = await fetch("/api/billing/invoice");
      const data = await res.json();
      if (data.invoiceUrl) {
        window.open(data.invoiceUrl, "_blank", "noopener");
      } else {
        toast.error("Não achei uma fatura em aberto. Tenta pelo e-mail do Asaas.");
      }
    } catch {
      toast.error("Falhou. Tenta de novo.");
    } finally {
      setLoadingInvoice(false);
    }
  }

  async function cancel() {
    if (
      !confirm(
        `Cancelar a assinatura ${PLAN_LABEL[plan]}? Você mantém o acesso até o fim do período já pago.`,
      )
    )
      return;
    setCanceling(true);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falhou");
      toast.success(
        data.keepProUntil
          ? `Assinatura cancelada. Acesso mantido até ${fmtDate(data.keepProUntil)}.`
          : "Assinatura cancelada.",
      );
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCanceling(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Plano atual ── */}
      <section className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-heading text-lg">
              Plano {PLAN_LABEL[plan]}
            </span>
            {isPaid && !pastDue && !canceled && (
              <Badge variant="secondary">ativo</Badge>
            )}
            {pastDue && <Badge variant="destructive">pagamento atrasado</Badge>}
            {canceled && <Badge variant="outline">cancelada</Badge>}
            {pending && <Badge variant="outline">aguardando pagamento</Badge>}
          </div>
          {isPaid && subscription?.status === "ACTIVE" && plan !== "TEAM" && (
            <Button
              variant="destructive"
              size="sm"
              onClick={cancel}
              disabled={canceling}
            >
              {canceling && <Loader2 className="size-3.5 animate-spin" />}
              Cancelar assinatura
            </Button>
          )}
        </div>

        {isPaid && (
          <p className="mt-3 text-sm text-muted-foreground">
            {canceled
              ? `Assinatura cancelada. Acesso ${PLAN_LABEL[plan]} até ${fmtDate(subscription?.currentPeriodEnd ?? null)}.`
              : pastDue
                ? "O último pagamento não entrou. Regularize a fatura pra não perder o acesso."
                : plan === "TEAM"
                  ? "Plano Team. Pra mudar, fala com a gente."
                  : `Próxima cobrança em ${fmtDate(subscription?.currentPeriodEnd ?? null)}.`}
          </p>
        )}

        {pastDue && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={openInvoice}
            disabled={loadingInvoice}
          >
            {loadingInvoice && <Loader2 className="size-3.5 animate-spin" />}
            Abrir fatura pra pagar
          </Button>
        )}

        {(plan === "FREE" || plan === "STARTER") && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Gerações neste mês</span>
              <span className="tabular-nums">
                {used} / {generateQuota.max}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  pct >= 100 ? "bg-destructive" : "bg-coral",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* ── Assinar / trocar de plano ── */}
      {offer.length > 0 && (
        <section className="space-y-4">
          {!billingEnabled ? (
            <div className="rounded-xl border border-coral/40 bg-card p-6">
              <p className="text-sm text-muted-foreground">
                A assinatura self-serve tá sendo ligada. Volta daqui a pouco.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
                <div className="space-y-1.5">
                  <Label htmlFor="cpf">CPF ou CNPJ</Label>
                  <Input
                    id="cpf"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(maskCpf(e.target.value))}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Exigido pelo Asaas pra emitir a cobrança. Fica só na sua
                    conta, pergunta uma vez só.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {offer.map((target) => (
                  <div
                    key={target}
                    className={cn(
                      "flex flex-col rounded-xl border bg-card p-6",
                      target === "PRO"
                        ? "border-coral/40 shadow-[0_0_0_1px_rgba(255,90,95,0.15)]"
                        : "border-border",
                    )}
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="font-heading text-lg">
                        {PLAN_LABEL[target]}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="font-heading text-3xl tracking-tight">
                          R${fmtPrice(prices[target])}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          /mês
                        </span>
                      </div>
                    </div>

                    <ul className="mt-4 flex-1 space-y-2 text-sm">
                      {PERKS[target].map((p) => (
                        <li key={p} className="flex gap-2.5">
                          <Check className="mt-0.5 size-4 shrink-0 text-coral" />
                          <span className="text-foreground/85">{p}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="mt-6"
                      variant={target === "PRO" ? "default" : "outline"}
                      onClick={() => subscribe(target)}
                      disabled={loadingPlan !== null}
                    >
                      {loadingPlan === target && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                      {plan === "STARTER"
                        ? "Fazer upgrade"
                        : pending
                          ? "Gerar nova fatura"
                          : `Assinar ${PLAN_LABEL[target]}`}
                    </Button>
                  </div>
                ))}
              </div>

              {pending && (
                <p className="text-xs text-muted-foreground">
                  Você tem uma assinatura aguardando pagamento. Já pagou? Clica em
                  Atualizar abaixo. Gerar nova fatura cancela a anterior.
                </p>
              )}
            </>
          )}
        </section>
      )}

      {/* ── Uso detalhado ── */}
      <section className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <div className="flex items-center justify-between">
          <span className="font-heading text-lg">Uso — últimos 30 dias</span>
          <Button variant="ghost" size="sm" onClick={() => router.refresh()}>
            <RefreshCw className="size-3.5" />
            Atualizar
          </Button>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          {[
            ["Gerações", usage30d.generate],
            ["Otimizações", usage30d.optimize],
            ["Templates IA", usage30d.templatize],
            ["Playground", usage30d.playground_run],
          ].map(([label, n]) => (
            <div key={label as string}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 font-heading text-xl tabular-nums">{n}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
