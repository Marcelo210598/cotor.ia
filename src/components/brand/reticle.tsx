import { cn } from "@/lib/utils";

/**
 * A mira do COTOR — eco do "O" da logo: abertura de diafragma + setas de
 * enquadramento. É o único lugar (com o CTA e o score) onde o coral aparece.
 */
export function Reticle({
  className,
  locked = false,
}: {
  className?: string;
  /** quando true, o núcleo fica coral (alvo "travado") */
  locked?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="COTOR"
      className={cn("h-6 w-6", className)}
    >
      {/* setas de enquadramento */}
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M24 3v6M24 39v6M3 24h6M39 24h6" />
      </g>
      {/* anel de abertura (hexágono cortado) */}
      <path
        d="M17 12h14l7 12-7 12H17l-7-12z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        opacity="0.55"
      />
      {/* núcleo */}
      <path
        d="M20 18.5h8l4 5.5-4 5.5h-8l-4-5.5z"
        fill={locked ? "var(--coral)" : "currentColor"}
        opacity={locked ? "1" : "0.9"}
      />
    </svg>
  );
}
