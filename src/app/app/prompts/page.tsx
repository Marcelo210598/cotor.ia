import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listPrompts } from "@/lib/prompts/queries";
import { LibraryClient } from "./library-client";

export const metadata = { title: "Biblioteca" };

export default async function PromptsLibraryPage() {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (!session) redirect("/entrar");

  const prompts = await listPrompts(session.user.id);

  return (
    <>
      <p className="eyebrow">Biblioteca</p>
      <h1 className="mt-3 font-heading text-2xl tracking-tight">
        Seus prompts
      </h1>
      <div className="mt-8">
        <LibraryClient initial={prompts} />
      </div>
    </>
  );
}
