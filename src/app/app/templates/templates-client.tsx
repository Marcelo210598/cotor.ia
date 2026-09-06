"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Search, Trash2 } from "lucide-react";
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
import { humanizeVar } from "@/lib/templates/vars";
import type { TemplateItem } from "@/lib/templates/queries";

export function TemplatesClient({ initial }: { initial: TemplateItem[] }) {
  const [items, setItems] = useState(initial);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TemplateItem | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (t) =>
        t.name.toLowerCase().includes(needle) ||
        (t.description ?? "").toLowerCase().includes(needle),
    );
  }, [items, q]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    const t = deleteTarget;
    setBusy(t.id);
    try {
      const res = await fetch(`/api/templates/${t.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falhou");
      setItems((prev) => prev.filter((x) => x.id !== t.id));
      toast.success("Template excluído.");
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
          Nenhum template ainda. Abre um prompt na{" "}
          <Link href="/app/prompts" className="text-coral hover:underline">
            biblioteca
          </Link>{" "}
          e clica em &ldquo;Salvar como template&rdquo;.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar template…"
          className="h-9 pl-8"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nada bate com essa busca.
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((t) => (
            <li
              key={t.id}
              className={cn(
                "group relative rounded-lg border border-border bg-card/50 transition-colors hover:border-coral/30",
                busy === t.id && "opacity-50",
              )}
            >
              <Link href={`/app/templates/${t.id}`} className="block px-4 py-3.5">
                <p className="truncate text-sm font-medium text-foreground">
                  {t.name}
                </p>
                {t.description && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {t.description}
                  </p>
                )}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {t.variables.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      sem variáveis
                    </span>
                  ) : (
                    t.variables.map((v) => (
                      <Badge key={v} variant="outline" className="font-mono">
                        {humanizeVar(v)}
                      </Badge>
                    ))
                  )}
                </div>
              </Link>

              <div className="absolute right-2 top-2.5 opacity-0 transition-opacity group-hover:opacity-100">
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
                      variant="destructive"
                      onClick={() => setDeleteTarget(t)}
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
            <DialogTitle>Excluir template?</DialogTitle>
            <DialogDescription>
              &ldquo;{deleteTarget?.name}&rdquo; some pra sempre. Os prompts da
              biblioteca não são afetados.
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
