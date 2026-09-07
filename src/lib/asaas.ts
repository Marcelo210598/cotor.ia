// Cliente Asaas — só servidor. Nunca importe de Client Component.
//
// Checkout de assinatura via Subscriptions API (não o checkout hospedado, que
// só aceita cartão). A gente cria o cliente + a assinatura e redireciona pra
// `invoiceUrl` da 1ª cobrança — página do Asaas com Pix / boleto / cartão.
//
// Sem ASAAS_API_KEY o billing fica desligado: `billingEnabled` = false e as
// funções lançam. As rotas checam isso antes de chamar.

function apiKey(): string {
  return process.env.ASAAS_API_KEY || "";
}

function baseUrl(): string {
  return process.env.ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";
}

/** Lido em runtime (não em build) — sem `ASAAS_API_KEY` o billing fica off. */
export function billingEnabled(): boolean {
  return apiKey().length > 0;
}

/** Plano Pro — único self-serve. Team é "falar com a gente". */
export const PRO = {
  price: 39, // R$/mês
  cycle: "MONTHLY" as const,
  description: "COTOR.IA — plano Pro (assinatura mensal)",
};

export class AsaasError extends Error {}

type AsaasErrorBody = { errors?: { code?: string; description?: string }[] };

async function call<T>(
  path: string,
  init?: RequestInit & { body?: string },
): Promise<T> {
  const key = apiKey();
  if (!key) throw new AsaasError("Billing não configurado (ASAAS_API_KEY vazia).");

  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "COTOR.IA",
      access_token: key,
      ...init?.headers,
    },
    cache: "no-store",
  });

  const raw = await res.text();
  const data = raw ? JSON.parse(raw) : {};

  if (!res.ok) {
    const body = data as AsaasErrorBody;
    const msg =
      body.errors?.[0]?.description || `Asaas respondeu ${res.status}.`;
    throw new AsaasError(msg);
  }
  return data as T;
}

/** yyyy-mm-dd no fuso de São Paulo (o Asaas espera data local). */
function todayBR(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

// ─────────────────────────── Customers ───────────────────────────

type AsaasCustomer = { id: string };

/**
 * Reaproveita `existingId` se já houver. Senão cria no Asaas. `cpfCnpj` é
 * obrigatório pra criar cliente — vem do form do checkout.
 */
export async function getOrCreateCustomer(args: {
  userId: string;
  name: string;
  email: string;
  cpfCnpj: string;
  existingId?: string | null;
}): Promise<string> {
  if (args.existingId) return args.existingId;

  const cus = await call<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: args.name,
      email: args.email,
      cpfCnpj: args.cpfCnpj.replace(/\D/g, ""),
      externalReference: args.userId,
      notificationDisabled: false,
    }),
  });
  return cus.id;
}

// ───────────────────────── Subscriptions ─────────────────────────

type AsaasSubscription = { id: string; status: string; nextDueDate?: string };

/** Cria a assinatura Pro. `billingType: UNDEFINED` = pagador escolhe na fatura. */
export async function createProSubscription(args: {
  customerId: string;
  userId: string;
}): Promise<{ id: string }> {
  const sub = await call<AsaasSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: args.customerId,
      billingType: "UNDEFINED",
      value: PRO.price,
      nextDueDate: todayBR(),
      cycle: PRO.cycle,
      description: PRO.description,
      externalReference: args.userId,
    }),
  });
  return { id: sub.id };
}

type AsaasPayment = {
  id: string;
  invoiceUrl?: string;
  status: string;
  dueDate?: string;
};

/**
 * Pega a URL de pagamento da 1ª cobrança da assinatura. O Asaas às vezes leva
 * um instante pra materializar a cobrança — tenta algumas vezes.
 */
export async function getFirstInvoiceUrl(
  subscriptionId: string,
): Promise<string | null> {
  for (let i = 0; i < 4; i++) {
    const list = await call<{ data: AsaasPayment[] }>(
      `/subscriptions/${subscriptionId}/payments?limit=1&sort=dueDate&order=asc`,
    );
    const url = list.data?.[0]?.invoiceUrl;
    if (url) return url;
    await new Promise((r) => setTimeout(r, 700));
  }
  return null;
}

export async function getSubscription(
  subscriptionId: string,
): Promise<AsaasSubscription | null> {
  try {
    return await call<AsaasSubscription>(`/subscriptions/${subscriptionId}`);
  } catch {
    return null;
  }
}

/** Cancela no Asaas. O acesso PRO fica até `currentPeriodEnd` (feito na rota). */
export async function cancelSubscription(
  subscriptionId: string,
): Promise<void> {
  await call(`/subscriptions/${subscriptionId}`, { method: "DELETE" });
}
