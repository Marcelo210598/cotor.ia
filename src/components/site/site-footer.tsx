import { Wordmark } from "@/components/brand/wordmark";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <Wordmark />
          <p className="text-xs">
            Create · Optimize · Test · Organize · Reuse
          </p>
        </div>
        <p className="text-xs">
          © {new Date().getFullYear()} COTOR.IA · feito no Brasil
        </p>
      </div>
    </footer>
  );
}
