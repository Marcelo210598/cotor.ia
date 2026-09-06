"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, LibraryBig } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { extractVars } from "@/lib/templates/vars";

export function SaveAsTemplateDialog({
  promptId,
  promptTitle,
  rendered,
}: {
  promptId: string;
  promptTitle: string;
  rendered: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(promptTitle);
  const [description, setDescription] = useState("");
  const [body, setBody] = useState(rendered);
  const [templatizing, setTemplatizing] = useState(false);
  const [saving, setSaving] = useState(false);

  const vars = extractVars(body);

  async function templatize() {
    setTemplatizing(true);
    try {
      const res = await fetch("/api/templates/templatize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falhou");
      setBody(data.body);
      toast.success(
        data.variables.length
          ? `${data.variables.length} variável(is) criada(s)`
          : "Nada específico pra parametrizar aqui.",
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setTemplatizing(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          body,
          sourcePromptId: promptId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falhou");
      toast.success("Template salvo.");
      setOpen(false);
      router.push(`/app/templates/${data.id}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <LibraryBig className="size-3.5" />
        Salvar como template
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Salvar como template</DialogTitle>
          <DialogDescription>
            Templatizar troca os valores específicos por{" "}
            <code className="font-mono">{"{{variaveis}}"}</code> que você preenche
            a cada uso. Você pode editar o texto antes de salvar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="eyebrow">nome</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="eyebrow">descrição (opcional)</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="eyebrow">corpo</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={templatize}
                disabled={templatizing}
              >
                {templatizing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                Templatizar com IA
              </Button>
            </div>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="max-h-[40vh] overflow-y-auto font-mono text-[0.75rem]"
            />
            <p className="text-xs text-muted-foreground">
              {vars.length
                ? `variáveis: ${vars.map((v) => `{{${v}}}`).join(" ")}`
                : "sem variáveis ainda — templatize ou adicione {{x}} na mão"}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving || !name.trim() || !body.trim()}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Salvar template
            </Button>
          </div>
        </div>
      </DialogContent>
      </Dialog>
    </>
  );
}
