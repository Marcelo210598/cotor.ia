import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { StructuredData } from "@/components/site/structured-data";
import { Hero } from "@/components/landing/hero";
import { ScoreSection } from "@/components/landing/score-section";
import { Pipeline } from "@/components/landing/pipeline";
import { Pillars } from "@/components/landing/pillars";
import { Pricing } from "@/components/landing/pricing";
import { Faq } from "@/components/landing/faq";
import { ClosingCta } from "@/components/landing/closing-cta";

export default function HomePage() {
  return (
    <>
      <StructuredData />
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <ScoreSection />
        <Pipeline />
        <Pillars />
        <Pricing />
        <Faq />
        <ClosingCta />
      </main>
      <SiteFooter />
    </>
  );
}
