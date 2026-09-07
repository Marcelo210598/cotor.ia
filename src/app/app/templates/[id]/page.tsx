import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getTemplate } from "@/lib/templates/queries";
import { TemplateUse } from "./template-use";

export async function generateMetadata({
  params,
}: PageProps<"/app/templates/[id]">) {
  const session = await getSession();
  if (!session) return { title: "Template" };
  const { id } = await params;
  const t = await getTemplate(session.user.id, id).catch(() => null);
  return { title: t?.name ?? "Template" };
}

export default async function TemplateDetailPage({
  params,
}: PageProps<"/app/templates/[id]">) {
  const session = await getSession();
  if (!session) redirect("/entrar");

  const { id } = await params;
  const template = await getTemplate(session.user.id, id);

  return <TemplateUse template={template} />;
}
