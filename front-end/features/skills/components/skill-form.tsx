"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SKILL_TYPE_LABEL } from "@/features/journey/components/skill-card";
import { Field, SubmitButton, selectClass } from "@/features/journey/components/ui";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { isValidDice } from "@/lib/journey/rules";
import { apiErrorMessage, apiFieldErrors } from "@/lib/api-error";
import { createSkill, updateSkill } from "@/features/skills/services/skill-service";
import type { Skill, SkillType } from "@/features/skills";
import { toast } from "sonner";

export function SkillForm({ initial, onDone }: { initial: Skill | null; onDone: () => void }) {

  const form = useValidatedForm({ f: { name: initial?.name ?? "", cost: String(initial?.cost ?? 2), spell_type: initial?.spell_type ?? ("DMGE" as SkillType), dice: initial?.dice ?? "", description: initial?.description ?? "", review: initial?.review ?? false } });
  const { handleSubmit, formState: { isSubmitting: loading }, validationErrors: err, setValidationErrors: setErr } = form;
  const f = form.watch("f");
  const setF = (next: typeof f) => form.setValue("f", next, { shouldDirty: true });

  async function submit() {
    const x: Record<string, string> = {};
    if (!f.name.trim()) x["name"] = "Informe o nome.";
    if (![2, 3, 5].includes(Number(f.cost))) x["cost"] = "Custo de 2, 3 ou 5.";
    if (f.dice.trim() !== "—" && !isValidDice(f.dice)) x["dice"] = "Use XdY ou XdY+Z, ou — para nenhum.";
    if (!f.description.trim()) x["description"] = "Descreva o efeito.";
    setErr(x);
    if (Object.keys(x).length) return;
    const payload = { name: f.name.trim(), cost: Number(f.cost), spell_type: f.spell_type, dice: f.dice.trim(), description: f.description.trim(), review: f.review };
    try {
      if (initial) await updateSkill(initial.id, payload);
      else await createSkill(payload);
    } catch (error) {
      // Custo/dado fora do catálogo chegam como erro de campo do servidor.
      const campos = apiFieldErrors(error);
      if (Object.keys(campos).length) {
        setErr(campos);
        return;
      }
      toast.error(apiErrorMessage(error, "Não foi possível salvar a habilidade."));
      return;
    }
    toast.success("Habilidade salva.");
    onDone();
  }
  return (
    <form onSubmit={handleSubmit(submit)} className="mt-6 space-y-4" noValidate>
      <Field label="Nome" error={err["name"]}><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Custo" error={err["cost"]}>
          <select className={selectClass} value={f.cost} onChange={(e) => setF({ ...f, cost: e.target.value })}>{[2, 3, 5].map((c) => <option key={c} value={c}>{c} PR</option>)}</select>
        </Field>
        <Field label="Tipo">
          <select className={selectClass} value={f.spell_type} onChange={(e) => setF({ ...f, spell_type: e.target.value as SkillType })}>
            {(Object.keys(SKILL_TYPE_LABEL) as SkillType[]).map((t) => <option key={t} value={t}>{SKILL_TYPE_LABEL[t]}</option>)}
          </select>
        </Field>
        <Field label="Dados" error={err["dice"]}><Input value={f.dice} onChange={(e) => setF({ ...f, dice: e.target.value })} placeholder="2d10" /></Field>
      </div>
      <Field label="Efeito" error={err["description"]}><Textarea rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
      <label className="flex items-center gap-2 text-sm"><Checkbox checked={f.review} onCheckedChange={(c) => setF({ ...f, review: !!c })} /> Marcar como [revisar]</label>
      <SubmitButton loading={loading}>Salvar habilidade</SubmitButton>
    </form>
  );
}
