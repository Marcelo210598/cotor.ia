import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { listPrompts } from "@/lib/prompts/queries";
import { LibraryClient } from "./library-client";

export const metadata = { title: "Biblioteca" };

export default async function PromptsLibraryPage() {
  const session = await getSession();
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
