"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Copy, Loader2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlaygroundPanel } from "@/components/cotor/playground-panel";
import { extractVars, fillTemplate, humanizeVar } from "@/lib/templates/vars";
import type { TemplateDetail } from "@/lib/templates/queries";

const LONG_HINT = /(texto|conteudo|conteúdo|transcri|email|e-mail|mensagem|corpo|descricao|descrição)/i;

export function TemplateUse({ template }: { template: TemplateDetail }) {
  const router = useRouter();

  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description ?? "");
  const [body, setBody] = useState(template.body);
  const [saving, setSaving] = useState(false);

  const vars = template.variables;
  const filled = useMemo(
    () => fillTemplate(template.body, values),
    [template.body, values],
  );
  const missing = useMemo(
    () => vars.filter((v) => !values[v]?.trim()),
    [vars, values],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(filled);
      setCopied(true);
      toast.success(
        missing.length
          ? `Copiado — ${missing.length} variável(is) sem preencher`
          : "Texto final copiado.",
      );
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Não consegui copiar. Seleciona e copia na mão.");
    }
  }

  async function saveEdits() {
    const newVars = extractVars(body);
    setSaving(true);
    try {
      const res = await fetch(`/api/templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          body,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falhou");
      toast.success(
        newVars.length !== template.variables.length
          ? `Salvo — agora ${newVars.length} variável(is)`
          : "Template salvo.",
      );
      setEditing(false);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/templates"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Templates
        </Link>

        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-heading text-2xl tracking-tight">
              {template.name}
            </h1>
            {template.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {template.description}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? <X className="size-3.5" /> : <Pencil className="size-3.5" />}
            {editing ? "Cancelar" : "Editar"}
          </Button>
        </div>
      </div>

      {editing ? (
        <div className="space-y-4 rounded-lg border border-border bg-card/40 p-4">
          <div className="space-y-1.5">
            <label className="eyebrow">nome</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="eyebrow">descrição</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="opcional"
            />
          </div>
          <div className="space-y-1.5">
            <label className="eyebrow">
              corpo — use {"{{"}variavel{"}}"} pros buracos
            </label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="max-h-[50vh] overflow-y-auto font-mono text-[0.8rem]"
            />
            <p className="text-xs text-muted-foreground">
              variáveis detectadas:{" "}
              {extractVars(body).map((v) => `{{${v}}}`).join(" ") || "nenhuma"}
            </p>
          </div>
          <Button onClick={saveEdits} disabled={saving || !name.trim()}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Salvar
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          {/* form */}
          <div className="space-y-4">
            <p className="eyebrow">preencher</p>
            {vars.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Esse template não tem variáveis — é só copiar.
              </p>
            ) : (
              vars.map((v) => (
                <div key={v} className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    {humanizeVar(v)}
                    <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                      {`{{${v}}}`}
                    </span>
                  </label>
                  {LONG_HINT.test(v) ? (
                    <Textarea
                      rows={3}
                      value={values[v] ?? ""}
                      onChange={(e) =>
                        setValues((s) => ({ ...s, [v]: e.target.value }))
                      }
                    />
                  ) : (
                    <Input
                      value={values[v] ?? ""}
                      onChange={(e) =>
                        setValues((s) => ({ ...s, [v]: e.target.value }))
                      }
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="eyebrow">texto final</p>
              <Button size="sm" variant="outline" onClick={copy}>
                {copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-border bg-card p-4 font-mono text-[0.8rem] leading-relaxed text-foreground/90">
              {filled}
            </pre>
            {missing.length > 0 && (
              <p className="text-xs text-muted-foreground">
                falta preencher: {missing.map(humanizeVar).join(", ")}
              </p>
            )}
            <PlaygroundPanel text={filled} />
          </div>
        </div>
      )}
    </div>
  );
}
