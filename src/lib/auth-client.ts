import { createAuthClient } from "better-auth/react";

// sem baseURL = mesma origem (funciona em qualquer domínio Vercel/local)
export const authClient = createAuthClient(
  process.env.NEXT_PUBLIC_APP_URL
    ? { baseURL: process.env.NEXT_PUBLIC_APP_URL }
    : {},
);

export const { signIn, signOut, useSession } = authClient;
