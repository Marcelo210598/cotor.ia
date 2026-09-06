"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  MoreHorizontal,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { TASK_TYPE_LABELS, type TaskType } from "@/lib/ai/schema";
import type { LibraryItem } from "@/lib/prompts/queries";

const GRADE_TONE: Record<string, string> = {
  A: "text-coral",
  B: "text-foreground/80",
  C: "text-foreground/60",
  D: "text-muted-foreground",
  E: "text-muted-foreground",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `há ${d} d`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `há ${mo} mês${mo > 1 ? "es" : ""}`;
  return `há ${Math.round(mo / 12)} ano(s)`;
}

export function LibraryClient({ initial }: { initial: LibraryItem[] }) {
  const [items, setItems] = useState(initial);
  const [q, setQ] = useState("");
  const [taskFilter, setTaskFilter] = useState<TaskType | "ALL">("ALL");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LibraryItem | null>(null);

  const allTags = useMemo(
    () => [...new Set(items.flatMap((i) => i.tags))].sort(),
    [items],
  );
  const taskTypes = useMemo(
    () => [...new Set(items.map((i) => i.taskType))],
    [items],
  );

  const archivedCount = items.filter((i) => i.archived).length;
  // se o último arquivado sai, volta pra lista ativa sozinho
  const viewingArchived = showArchived && archivedCount > 0;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((i) => {
      if (i.archived !== viewingArchived) return false;
      if (taskFilter !== "ALL" && i.taskType !== taskFilter) return false;
      if (tagFilter && !i.tags.includes(tagFilter)) return false;
      if (
        needle &&
        !i.title.toLowerCase().includes(needle) &&
        !i.intent.toLowerCase().includes(needle)
      )
        return false;
      return true;
    });
  }, [items, q, taskFilter, tagFilter, viewingArchived]);

  async function setArchived(item: LibraryItem, archived: boolean) {
    setBusy(item.id);
    try {
      const res = await fetch(`/api/prompts/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falhou");
      setItems((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, archived } : p)),
      );
      toast.success(archived ? "Arquivado." : "Desarquivado.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const item = deleteTarget;
    setBusy(item.id);
    try {
      const res = await fetch(`/api/prompts/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falhou");
      setItems((prev) => prev.filter((p) => p.id !== item.id));
      toast.success("Prompt excluído.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
      setDeleteTarget(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border/70 bg-card/40 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhum prompt ainda. Vai no{" "}
          <Link href="/app" className="text-coral hover:underline">
            Novo
          </Link>{" "}
          e cria o primeiro.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* controles */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título ou intenção…"
            className="h-9 pl-8"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip
            active={taskFilter === "ALL"}
            onClick={() => setTaskFilter("ALL")}
          >
            Todos
          </FilterChip>
          {taskTypes.map((t) => (
            <FilterChip
              key={t}
              active={taskFilter === t}
              onClick={() => setTaskFilter(taskFilter === t ? "ALL" : t)}
            >
              {TASK_TYPE_LABELS[t]}
            </FilterChip>
          ))}
          {archivedCount > 0 && (
            <FilterChip
              active={viewingArchived}
              onClick={() => setShowArchived((v) => !v)}
            >
              Arquivados ({archivedCount})
            </FilterChip>
          )}
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="eyebrow mr-1">tags</span>
            {allTags.map((tag) => (
              <FilterChip
                key={tag}
                active={tagFilter === tag}
                onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              >
                {tag}
              </FilterChip>
            ))}
          </div>
        )}
      </div>

      {/* lista */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nada bate com esse filtro.
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((item) => (
            <li
              key={item.id}
              className={cn(
                "group relative rounded-lg border border-border bg-card/50 transition-colors hover:border-coral/30",
                busy === item.id && "opacity-50",
              )}
            >
              <Link
                href={`/app/prompts/${item.id}`}
                className="block px-4 py-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {item.intent}
                    </p>
                  </div>
                  {item.latestScore && (
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                      <span className={GRADE_TONE[item.latestScore.grade]}>
                        {item.latestScore.overall}
                      </span>
                      <span className="text-foreground/30"> / </span>
                      {item.latestScore.grade}
                    </span>
                  )}
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="font-mono">
                    {TASK_TYPE_LABELS[item.taskType]}
                  </Badge>
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="ghost" className="text-muted-foreground">
                      {tag}
                    </Badge>
                  ))}
                  <span className="ml-auto text-xs text-muted-foreground">
                    v{item.versionCount} · {relativeTime(item.updatedAt)}
                  </span>
                </div>
              </Link>

              <div className="absolute right-2 top-2.5 opacity-0 transition-opacity group-hover:opacity-100 data-[open]:opacity-100">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" aria-label="Ações" />
                    }
                  >
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setArchived(item, !item.archived)}
                    >
                      {item.archived ? (
                        <>
                          <ArchiveRestore className="size-4" />
                          Desarquivar
                        </>
                      ) : (
                        <>
                          <Archive className="size-4" />
                          Arquivar
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 className="size-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir prompt?</DialogTitle>
            <DialogDescription>
              &ldquo;{deleteTarget?.title}&rdquo; e todas as suas versões somem
              pra sempre. Não dá pra desfazer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={busy !== null}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs transition-colors",
        active
          ? "border-coral/40 bg-coral/10 text-foreground"
          : "border-border text-muted-foreground hover:border-coral/30 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
