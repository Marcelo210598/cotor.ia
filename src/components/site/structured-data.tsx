import { FAQ_ITEMS } from "@/components/landing/faq";

const base =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://cotor-ia.vercel.app";

/** JSON-LD da landing: o app + as FAQs. Ajuda busca tradicional (rich results)
 * e generativa (as IAs de busca citam dados estruturados). */
export function StructuredData() {
  const graph = [
    {
      "@type": "WebSite",
      "@id": `${base}/#website`,
      name: "COTOR.IA",
      url: base,
      inLanguage: "pt-BR",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${base}/#app`,
      name: "COTOR.IA",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      url: base,
      description:
        "Copiloto de engenharia de prompts: transforma a intenção crua em prompt profissional, pontua numa rubrica de 10 dimensões e otimiza em loop.",
      inLanguage: "pt-BR",
      offers: [
        {
          "@type": "Offer",
          name: "Free",
          price: "0",
          priceCurrency: "BRL",
        },
        {
          "@type": "Offer",
          name: "Starter",
          price: "19.90",
          priceCurrency: "BRL",
        },
        {
          "@type": "Offer",
          name: "Pro",
          price: "39.00",
          priceCurrency: "BRL",
        },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${base}/#faq`,
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      // conteúdo estático e controlado por nós — sem input de usuário
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}
