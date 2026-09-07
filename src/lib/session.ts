import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Sessão do request, deduplicada. O layout do `/app` e a página renderizam no
 * mesmo request — sem o `cache()` isso era 2 leituras de sessão por navegação.
 */
export const getSession = cache(async () => {
  return auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
});
