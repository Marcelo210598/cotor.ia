import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Hero } from "@/components/landing/hero";
import { ScoreSection } from "@/components/landing/score-section";
import { Pipeline } from "@/components/landing/pipeline";
import { Pillars } from "@/components/landing/pillars";
import { Pricing } from "@/components/landing/pricing";
import { ClosingCta } from "@/components/landing/closing-cta";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <ScoreSection />
        <Pipeline />
        <Pillars />
        <Pricing />
        <ClosingCta />
      </main>
      <SiteFooter />
    </>
  );
}
