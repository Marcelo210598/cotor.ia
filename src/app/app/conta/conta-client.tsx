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

const PLAN_LABEL: Record<AccountSummary["plan"], string> = {
  FREE: "Free",
  PRO: "Pro",
  TEAM: "Team",
};

const PRO_PERKS = [
  "Geração praticamente ilimitada",
  "Loop de otimização e diff de versões sem trava",
  "Playground liberado",
];

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
  proPrice,
}: {
  summary: AccountSummary;
  email: string;
  billingEnabled: boolean;
  proPrice: number;
}) {
  const router = useRouter();
  const { plan, subscription, generateQuota, usage30d } = summary;

  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const isPaid = plan === "PRO" || plan === "TEAM";
  const pending = subscription?.status === "PENDING";
  const pastDue = subscription?.status === "PAST_DUE";

  const used = usage30d.generate;
  const pct = Math.min(100, Math.round((used / generateQuota.max) * 100));

  async function subscribe() {
    const digits = cpf.replace(/\D/g, "");
    if (digits.length !== 11 && digits.length !== 14) {
      toast.error("Digita um CPF (ou CNPJ) válido.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpfCnpj: digits }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falhou");
      window.location.href = data.invoiceUrl;
    } catch (e) {
      toast.error((e as Error).message);
      setLoading(false);
    }
  }

  async function cancel() {
    if (
      !confirm(
        "Cancelar a assinatura Pro? Você continua com o Pro até o fim do período já pago.",
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
          ? `Assinatura cancelada. Pro ativo até ${fmtDate(data.keepProUntil)}.`
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
            {isPaid && !pastDue && (
              <Badge variant="secondary">ativo</Badge>
            )}
            {pastDue && <Badge variant="destructive">pagamento atrasado</Badge>}
            {pending && <Badge variant="outline">aguardando pagamento</Badge>}
          </div>
          {isPaid && subscription?.status === "ACTIVE" && (
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

        {isPaid ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {subscription?.status === "CANCELED"
              ? `Assinatura cancelada. Pro ativo até ${fmtDate(subscription.currentPeriodEnd)}.`
              : pastDue
                ? "O último pagamento não entrou. Regularize a fatura no Asaas pra não perder o acesso."
                : `Próxima cobrança em ${fmtDate(subscription?.currentPeriodEnd ?? null)}.`}
          </p>
        ) : (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Gerações neste mês
              </span>
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

      {/* ── Upgrade ── */}
      {!isPaid && (
        <section className="rounded-xl border border-coral/40 bg-card p-6 shadow-[0_0_0_1px_rgba(255,90,95,0.15)]">
          <div className="flex items-baseline justify-between">
            <span className="font-heading text-lg">Pro</span>
            <div className="flex items-baseline gap-1">
              <span className="font-heading text-3xl tracking-tight">
                R${proPrice}
              </span>
              <span className="text-sm text-muted-foreground">/mês</span>
            </div>
          </div>

          <ul className="mt-4 space-y-2 text-sm">
            {PRO_PERKS.map((p) => (
              <li key={p} className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-coral" />
                <span className="text-foreground/85">{p}</span>
              </li>
            ))}
          </ul>

          {!billingEnabled ? (
            <p className="mt-6 text-sm text-muted-foreground">
              A assinatura self-serve tá sendo ligada. Volta daqui a pouco.
            </p>
          ) : (
            <div className="mt-6 space-y-3">
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
                  Exigido pelo Asaas pra emitir a cobrança. Fica só na sua conta.
                </p>
              </div>
              <Button onClick={subscribe} disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                {pending ? "Gerar nova fatura" : "Assinar Pro"}
              </Button>
              {pending && (
                <p className="text-xs text-muted-foreground">
                  Você já tem uma assinatura aguardando pagamento — se já pagou,
                  clica em atualizar abaixo. Gerar nova fatura cancela a anterior.
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* ── Uso detalhado ── */}
      <section className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <div className="flex items-center justify-between">
          <span className="font-heading text-lg">Uso — últimos 30 dias</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.refresh()}
          >
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
