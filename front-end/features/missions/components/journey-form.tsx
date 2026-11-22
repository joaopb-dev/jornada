"use client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, SubmitButton } from "@/features/journey/components/ui";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { apiErrorMessage, apiFieldErrors } from "@/lib/api-error";
import { createJourney, updateJourney } from "@/features/missions/services/journey-service";
import type { Journey } from "@/features/missions";
import { toast } from "sonner";

export function JourneyForm({ initial, onDone }: { initial: Journey | null; onDone: () => void }) {
  const form = useValidatedForm({
    f: {
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      is_active: initial?.is_active ?? true,
    },
  });
  const { handleSubmit, formState: { isSubmitting: loading }, validationErrors: err, setValidationErrors: setErr } = form;
  const f = form.watch("f");
  const setF = (next: typeof f) => form.setValue("f", next, { shouldDirty: true });

  async function submit() {
    const x: Record<string, string> = {};
    if (!f.name.trim()) x["name"] = "Informe o nome da jornada.";
    setErr(x);
    if (Object.keys(x).length) return;
    const payload = { name: f.name.trim(), description: f.description.trim(), is_active: f.is_active };
    try {
      if (initial) await updateJourney(initial.id, payload);
      else await createJourney(payload);
    } catch (error) {
      const campos = apiFieldErrors(error);
      if (Object.keys(campos).length) {
        setErr(campos);
        return;
      }
      toast.error(apiErrorMessage(error, "Não foi possível salvar a jornada."));
      return;
    }
    toast.success("Jornada salva.");
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="mt-6 space-y-4" noValidate>
      <Field label="Nome" error={err["name"]}><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Descrição"><Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} />
        Jornada ativa (aparece para os grupos)
      </label>
      <SubmitButton loading={loading}>Salvar jornada</SubmitButton>
    </form>
  );
}
