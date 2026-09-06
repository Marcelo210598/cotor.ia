"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  GitCompareArrows,
  Loader2,
  Pencil,
  RotateCcw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PromptResult } from "@/components/cotor/prompt-result";
import { VersionDiff } from "@/components/cotor/version-diff";
import { cn } from "@/lib/utils";
import { TASK_TYPE_LABELS } from "@/lib/ai/schema";
import type { PromptDetailData, DetailVersion } from "@/lib/prompts/queries";

const ACTION_LABEL: Record<string, string> = {
  GENERATE: "gerada",
  OPTIMIZE: "otimizada",
  MANUAL_EDIT: "editada",
  BRANCH: "restaurada",
};

export function PromptDetail({ detail }: { detail: PromptDetailData }) {
  const router = useRouter();
  const versions = detail.versions;
  const head = versions[versions.length - 1];

  const [selectedId, setSelectedId] = useState(head?.id);
  const [compareId, setCompareId] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const [title, setTitle] = useState(detail.title);
  const [editingTitle, setEditingTitle] = useState(false);
  const [tags, setTags] = useState(detail.tags);
  const [tagDraft, setTagDraft] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);

  const selected = versions.find((v) => v.id === selectedId) ?? head;
  const compareWith = compareId
    ? versions.find((v) => v.id === compareId)
    : null;

  async function patch(body: Record<string, unknown>) {
    setSavingMeta(true);
    try {
      const res = await fetch(`/api/prompts/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falhou");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingMeta(false);
    }
  }

  async function saveTitle() {
    setEditingTitle(false);
    const next = title.trim();
    if (!next || next === detail.title) {
      setTitle(detail.title);
      return;
    }
    await patch({ title: next });
    toast.success("Título atualizado.");
  }

  async function addTag() {
    const t = tagDraft.trim().toLowerCase();
    setTagDraft("");
    if (!t || tags.includes(t)) return;
    const next = [...tags, t];
    setTags(next);
    await patch({ tags: next });
  }

  async function removeTag(t: string) {
    const next = tags.filter((x) => x !== t);
    setTags(next);
    await patch({ tags: next });
  }

  async function restore(v: DetailVersion) {
    setRestoring(true);
    try {
      const res = await fetch(`/api/prompts/${detail.id}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId: v.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falhou");
      toast.success(`v${data.number} criada a partir da v${data.from}`);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRestoring(false);
    }
  }

  function toggleCompare() {
    if (comparing) {
      setComparing(false);
      setCompareId(null);
    } else {
      setComparing(true);
      // pré-seleciona a versão anterior à selecionada, se houver
      const idx = versions.findIndex((v) => v.id === selected?.id);
      setCompareId(idx > 0 ? versions[idx - 1].id : null);
    }
  }

  const deltaVsCompare =
    compareWith?.score && selected?.score
      ? selected.score.overall - compareWith.score.overall
      : undefined;

  return (
    <div className="space-y-6">
      {/* voltar + meta */}
      <div>
        <Link
          href="/app/prompts"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Biblioteca
        </Link>

        <div className="mt-3 flex items-start gap-2">
          {editingTitle ? (
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitle();
                if (e.key === "Escape") {
                  setTitle(detail.title);
                  setEditingTitle(false);
                }
              }}
              className="h-9 max-w-md text-lg"
            />
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="group inline-flex items-center gap-2 text-left"
            >
              <h1 className="font-heading text-2xl tracking-tight">{title}</h1>
              <Pencil className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
          {detail.archived && (
            <Badge variant="secondary" className="mt-1.5">
              arquivado
            </Badge>
          )}
        </div>

        <p className="mt-2 text-sm text-muted-foreground">{detail.intent}</p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="font-mono">
            {TASK_TYPE_LABELS[detail.taskType]}
          </Badge>
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
            >
              {t}
              <button
                onClick={() => removeTag(t)}
                className="hover:text-foreground"
                aria-label={`Remover tag ${t}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <input
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            onBlur={addTag}
            placeholder="+ tag"
            className="w-20 rounded-full border border-dashed border-border bg-transparent px-2 py-0.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-coral/40"
          />
          {savingMeta && (
            <Loader2 className="size-3 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[180px_1fr]">
        {/* trilha de versões */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="eyebrow">versões</p>
            {versions.length > 1 && (
              <button
                onClick={toggleCompare}
                className={cn(
                  "inline-flex items-center gap-1 text-xs transition-colors",
                  comparing
                    ? "text-coral"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <GitCompareArrows className="size-3.5" />
                {comparing ? "sair" : "comparar"}
              </button>
            )}
          </div>

          <ol className="space-y-1">
            {[...versions].reverse().map((v) => {
              const isSelected = v.id === selected?.id;
              const isCompare = v.id === compareId;
              return (
                <li key={v.id}>
                  <button
                    onClick={() => {
                      if (comparing && !isSelected) {
                        setCompareId(isCompare ? null : v.id);
                      } else {
                        setSelectedId(v.id);
                        if (comparing) setCompareId(null);
                      }
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md border px-2.5 py-1.5 text-left text-sm transition-colors",
                      isSelected
                        ? "border-coral/40 bg-coral/10"
                        : isCompare
                          ? "border-foreground/30 bg-secondary"
                          : "border-border hover:border-coral/30",
                    )}
                  >
                    <span className="font-mono">
                      v{v.number}
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        {ACTION_LABEL[v.action] ?? v.action.toLowerCase()}
                      </span>
                    </span>
                    {v.score && (
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        {v.score.overall}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>

          {comparing && (
            <p className="text-xs text-muted-foreground">
              Selecionada = v{selected?.number}. Clica em outra pra comparar.
            </p>
          )}

          {selected && selected.id !== head?.id && !comparing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => restore(selected)}
              disabled={restoring}
              className="w-full"
            >
              {restoring ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RotateCcw className="size-3.5" />
              )}
              Restaurar v{selected.number}
            </Button>
          )}
        </div>

        {/* conteúdo */}
        <div className="min-w-0">
          {comparing && compareWith && selected ? (
            <div className="space-y-4">
              {typeof deltaVsCompare === "number" && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="eyebrow">nota</span>
                  <span className="font-mono">
                    v{compareWith.number}: {compareWith.score?.overall ?? "—"}
                  </span>
                  <span className="text-foreground/40">→</span>
                  <span className="font-mono">
                    v{selected.number}: {selected.score?.overall ?? "—"}
                  </span>
                  {deltaVsCompare !== 0 && (
                    <span
                      className={cn(
                        "font-mono text-xs",
                        deltaVsCompare > 0
                          ? "text-coral"
                          : "text-muted-foreground",
                      )}
                    >
                      ({deltaVsCompare > 0 ? "+" : ""}
                      {deltaVsCompare})
                    </span>
                  )}
                </div>
              )}
              {(() => {
                const older =
                  compareWith.number < selected.number ? compareWith : selected;
                const newer =
                  compareWith.number < selected.number ? selected : compareWith;
                return (
                  <VersionDiff
                    a={older.ir}
                    b={newer.ir}
                    labelA={`v${older.number}`}
                    labelB={`v${newer.number}`}
                  />
                );
              })()}
            </div>
          ) : selected ? (
            selected.score ? (
              <PromptResult
                ir={selected.ir}
                rendered={selected.rendered}
                score={selected.score}
                version={selected.number}
                taskType={detail.taskType}
              />
            ) : (
              <div className="space-y-4">
                <p className="eyebrow">o prompt · v{selected.number}</p>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-border bg-card p-4 font-mono text-[0.8rem] leading-relaxed text-foreground/90">
                  {selected.rendered}
                </pre>
                <p className="text-xs text-muted-foreground">
                  Essa versão não tem score guardado.
                </p>
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
