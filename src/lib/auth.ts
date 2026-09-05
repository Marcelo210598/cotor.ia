import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db";

/**
 * Só Google OAuth. Sem senha = nada pra vazar, nada de fluxo de reset pra
 * explorar. Sessão em banco (tabela `session`).
 */
export const auth = betterAuth({
  appName: "COTOR.IA",
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 dias
    updateAge: 60 * 60 * 24, // renova a cada 1 dia de uso
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
