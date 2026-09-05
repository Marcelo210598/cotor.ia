"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";

export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    try {
      await signIn.social({ provider: "google", callbackURL: "/app" });
    } catch {
      toast.error("Não deu pra iniciar o login. Tenta de novo em instantes.");
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handle}
      disabled={loading}
      size="lg"
      variant="outline"
      className="w-full"
    >
      <GoogleGlyph />
      {loading ? "Abrindo o Google…" : "Continuar com o Google"}
    </Button>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C17.1 2.6 14.8 1.6 12 1.6 6.9 1.6 2.7 5.8 2.7 12s4.2 10.4 9.3 10.4c5.4 0 8.9-3.8 8.9-9.1 0-.6-.06-1.1-.15-1.6H12z"
      />
    </svg>
  );
}
