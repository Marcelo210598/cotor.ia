import type { MetadataRoute } from "next";
import { listPublicPromptIds } from "@/lib/prompts/queries";

const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://cotor-ia.vercel.app";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/termos`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacidade`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const prompts = await listPublicPromptIds().catch(() => []);
  const promptRoutes: MetadataRoute.Sitemap = prompts.map((p) => ({
    url: `${base}/p/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...promptRoutes];
}
