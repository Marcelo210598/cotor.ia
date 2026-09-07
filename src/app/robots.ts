import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://cotor-ia.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // área logada, APIs e fluxo de auth não devem ser indexados
        disallow: ["/app", "/app/", "/api/", "/entrar"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
