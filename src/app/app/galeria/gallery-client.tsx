"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { TASK_TYPE_LABELS } from "@/lib/ai/schema";
import type { GalleryItem } from "@/lib/prompts/queries";
import type { TaskType } from "@/lib/ai/schema";

type Group = { taskType: TaskType; items: GalleryItem[] };

export function GalleryClient({ groups }: { groups: Group[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<TaskType | "TODOS">("TODOS");
  const [open, setOpen] = useState<GalleryItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [forking, setForking] = useState(false);

  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const shown =
    filter === "TODOS" ? groups : groups.filter((g) => g.taskType === filter);

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Prompt copiado.");
    setTimeout(() => setCopied(false), 1600);
  }

  async function fork(item: GalleryItem) {
    setForking(true);
    try {
      const res = await fetch("/api/gallery/fork", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId: item.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falhou");
      toast.success("Copiado pra sua biblioteca.");
      router.push(`/app/prompts/${data.id}`);
    } catch (e) {
      toast.error((e as Error).message);
      setForking(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* filtro por categoria */}
      <div className="flex flex-wrap gap-1.5">
        <FilterChip
          active={filter === "TODOS"}
          onClick={() => setFilter("TODOS")}
          label={`Todos (${total})`}
        />
        {groups.map((g) => (
          <FilterChip
            key={g.taskType}
            active={filter === g.taskType}
            onClick={() => setFilter(g.taskType)}
            label={`${TASK_TYPE_LABELS[g.taskType]} (${g.items.length})`}
          />
        ))}
      </div>

      {shown.map((g) => (
        <section key={g.taskType}>
          <p className="eyebrow">{TASK_TYPE_LABELS[g.taskType]}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((item) => (
              <button
                key={item.id}
                onClick={() => setOpen(item)}
                className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-coral/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-heading text-sm leading-snug">
                    {item.title}
                  </span>
                  {item.score && (
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                      {item.score.overall}
                    </span>
                  )}
                </div>
                <span className="line-clamp-3 font-mono text-[0.7rem] leading-relaxed text-muted-foreground">
                  {item.rendered}
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-2xl">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-6">{open.title}</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {TASK_TYPE_LABELS[open.taskType]}
                </Badge>
                {open.score && (
                  <span className="font-mono text-xs text-muted-foreground">
                    Score {open.score.overall}/100 · {open.score.grade}
                  </span>
                )}
              </div>
              <pre className="max-h-[45vh] overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-3 font-mono text-[0.75rem] leading-relaxed text-foreground/90">
                {open.rendered}
              </pre>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => fork(open)} disabled={forking}>
                  {forking ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  Usar como base
                </Button>
                <Button variant="outline" onClick={() => copy(open.rendered)}>
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  Copiar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                &quot;Usar como base&quot; clona pra sua biblioteca (não gasta
                geração) — aí você ajusta e otimiza pro seu caso.
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "border-coral/40 bg-coral/10 text-foreground"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
