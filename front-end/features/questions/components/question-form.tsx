"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, SubmitButton } from "@/features/journey/components/ui";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { cn } from "@/lib/utils";
import { apiErrorMessage, apiFieldErrors } from "@/lib/api-error";
import { createQuestion, updateQuestion } from "@/features/questions/services/question-service";
import type { Question } from "@/features/questions";
import { CheckCircle2, Circle, Plus, Trash2 } from "@/components/icons/rpg-icons";
import { toast } from "sonner";

export function QuestionForm({ initial, onDone }: { initial: Question | null; onDone: () => void }) {

  const form = useValidatedForm({
    language: initial?.language ?? "",
    text: initial?.text ?? "",
    choices: initial?.choices.map((c) => ({ text: c.text, correct: c.is_correct })) ?? [
      { text: "", correct: true },
      { text: "", correct: false },
    ],
  });
  const { handleSubmit, formState: { isSubmitting: loading }, validationErrors: err, setValidationErrors: setErr } = form;
  const text = form.watch("text");
  const language = form.watch("language");
  const setText = (next: typeof text) => form.setValue("text", next, { shouldDirty: true });
  const choices = form.watch("choices");
  const setChoices = (next: typeof choices) => form.setValue("choices", next, { shouldDirty: true });

  async function submit() {
    const x: Record<string, string> = {};
    if (!text.trim()) x["text"] = "Informe o enunciado.";
    const filled = choices.filter((o) => o.text.trim());
    if (filled.length < 2) x["choices"] = "Informe ao menos duas alternativas.";
    else if (!filled.some((o) => o.correct)) x["choices"] = "Marque ao menos uma alternativa correta.";
    setErr(x);
    if (Object.keys(x).length) return;
    const payload = {
      text: text.trim(),
      language: language.trim(),
      choices: filled.map((o) => ({ text: o.text.trim(), is_correct: o.correct })),
    };
    try {
      if (initial) await updateQuestion(initial.id, payload);
      else await createQuestion(payload);
    } catch (error) {
      // As regras do servidor chegam como lista no topo → toast; erros de
      // campo (shape) caem no input.
      const campos = apiFieldErrors(error);
      if (Object.keys(campos).length) {
        setErr(campos);
        return;
      }
      toast.error(apiErrorMessage(error, "Não foi possível salvar a pergunta."));
      return;
    }
    toast.success("Pergunta salva.");
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="mt-6 space-y-4" noValidate>
      <Field label="Linguagem"><Input value={language} maxLength={100} onChange={(event) => form.setValue("language", event.target.value)} /></Field>
      <Field label="Enunciado" error={err["text"]}><Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} /></Field>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Alternativas</p>
          <Button type="button" variant="ghost" size="sm" onClick={() => setChoices([...choices, { text: "", correct: false }])}><Plus /> Adicionar</Button>
        </div>
        {choices.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <button type="button" aria-label="Marcar como correta" onClick={() => setChoices(choices.map((x, j) => (j === i ? { ...x, correct: !x.correct } : x)))}
              className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-md border", o.correct ? "border-success bg-accent text-accent-foreground" : "border-input text-muted-foreground")}>
              {o.correct ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
            </button>
            <Input value={o.text} onChange={(e) => setChoices(choices.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} placeholder={`Alternativa ${i + 1}`} />
            <Button type="button" variant="ghost" size="icon" aria-label="Remover" disabled={choices.length <= 2} onClick={() => setChoices(choices.filter((_, j) => j !== i))}><Trash2 /></Button>
          </div>
        ))}
        {err["choices"] && <p className="text-xs text-destructive">{err["choices"]}</p>}
      </div>
      <SubmitButton loading={loading}>Salvar pergunta</SubmitButton>
    </form>
  );
}
