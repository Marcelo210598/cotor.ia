import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPromptDetail } from "@/lib/prompts/queries";
import { PromptDetail } from "./prompt-detail";

export async function generateMetadata({
  params,
}: PageProps<"/app/prompts/[id]">) {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (!session) return { title: "Prompt" };
  const { id } = await params;
  const detail = await getPromptDetail(session.user.id, id).catch(() => null);
  return { title: detail?.title ?? "Prompt" };
}

export default async function PromptDetailPage({
  params,
}: PageProps<"/app/prompts/[id]">) {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (!session) redirect("/entrar");

  const { id } = await params;
  const detail = await getPromptDetail(session.user.id, id);

  return <PromptDetail detail={detail} />;
}
