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
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5 opacity-80 transition-opacity group-hover:opacity-100"
        aria-hidden
      >
        <defs>
          <linearGradient id="mdev" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4F7DF5" />
            <stop offset="1" stopColor="#7B3FF2" />
          </linearGradient>
        </defs>
        <g
          fill="none"
          stroke="url(#mdev)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        >
          <path d="M12 2L22 12L12 22L2 12Z" />
          <path d="M12 6.5L17.5 12L12 17.5L6.5 12Z" />
        </g>
        <circle cx="12" cy="12" r="2.1" fill="url(#mdev)" />
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
