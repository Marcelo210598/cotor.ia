import { cn } from "@/lib/utils";

/**
 * Crédito discreto: "criado por marcelo.dev". Pequeno, mono, com um glifo
 * mínimo — perceptível sem competir com a marca do COTOR.
 */
export function MadeBy({ className }: { className?: string }) {
  return (
    <a
      href="https://marcelo.dev"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group inline-flex items-center gap-1.5 font-mono text-[0.6875rem] tracking-[0.06em] text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      <svg
        viewBox="0 0 12 12"
        className="h-3 w-3 text-muted-foreground transition-colors group-hover:text-coral"
        aria-hidden
      >
        <path
          d="M6 1L11 6L6 11L1 6Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
      <span>
        criado por{" "}
        <span className="text-foreground/80 group-hover:text-foreground">
          marcelo<span className="text-coral">.dev</span>
        </span>
      </span>
    </a>
  );
}
