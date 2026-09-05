import Link from "next/link";
import { Reticle } from "@/components/brand/reticle";
import { cn } from "@/lib/utils";

export function Wordmark({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 font-heading text-[0.95rem] tracking-[0.02em]",
        className,
      )}
    >
      <span className="text-foreground">COT</span>
      <Reticle className="h-[1.15em] w-[1.15em] text-foreground transition-colors group-hover:text-coral" />
      <span className="text-foreground">R.IA</span>
    </Link>
  );
}
