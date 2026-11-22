"use client";
import { Input } from "@/components/ui/input";
import { Field, SubmitButton } from "@/features/journey/components/ui";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { apiErrorMessage, apiFieldErrors } from "@/lib/api-error";
import { validateRegistration } from "@/lib/journey/students";
import { createStudent, updateStudent } from "@/features/students/services/student-service";
import type { Student } from "@/features/students";
import { toast } from "sonner";

export function StudentForm({ initial, onDone }: { initial: Student | null; onDone: () => void }) {
  const form = useValidatedForm({ f: { name: initial?.name ?? "", matricula: initial?.matricula ?? "" } });
  const { handleSubmit, formState: { isSubmitting: loading }, validationErrors: err, setValidationErrors: setErr } = form;
  const f = form.watch("f");
  const setF = (next: typeof f) => form.setValue("f", next, { shouldDirty: true });

  async function submit() {
    const x: Record<string, string> = {};
    if (!f.name.trim()) x["name"] = "Informe o nome.";
    const registrationError = validateRegistration(f.matricula);
    if (registrationError) x["matricula"] = registrationError;
    setErr(x);
    if (Object.keys(x).length) return;
    const payload = { name: f.name.trim(), matricula: f.matricula.trim() };
    try {
      if (initial) await updateStudent(initial.id, payload);
      else await createStudent(payload);
    } catch (error) {
      // Unicidade e demais regras são do servidor: caem no campo.
      const campos = apiFieldErrors(error);
      if (Object.keys(campos).length) {
        setErr(campos);
        return;
      }
      toast.error(apiErrorMessage(error, "Não foi possível salvar o aventureiro."));
      return;
    }
    toast.success("Aventureiro salvo.");
    onDone();
  }
  return (
    <form onSubmit={handleSubmit(submit)} className="mt-6 space-y-4" noValidate>
      <Field label="Nome" error={err["name"]}><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Matrícula" error={err["matricula"]}><Input required value={f.matricula} onChange={(e) => setF({ ...f, matricula: e.target.value })} /></Field>
      <SubmitButton loading={loading}>Salvar</SubmitButton>
    </form>
  );
}
