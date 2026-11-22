"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, SubmitButton, selectClass } from "@/features/journey/components/ui";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { apiErrorMessage, apiFieldErrors } from "@/lib/api-error";
import { createGroup, setGroupMembers, updateGroup } from "@/features/groups/services/group-service";
import { CrestPicker, crestOf, crestToApi, type CrestSpec } from "@/features/crest";
import type { Group } from "@/features/groups";
import type { Student } from "@/features/students";
import { Plus, X } from "@/components/icons/rpg-icons";
import { toast } from "sonner";

export function TeamForm({ initial, students, groups, onDone }: { initial: Group | null; students: Student[]; groups: Group[]; onDone: () => void }) {
  const membrosIniciais = initial ? students.filter((s) => s.group === initial.id).map((s) => s.id) : [];
  const form = useValidatedForm({
    name: initial?.name ?? "",
    letter: initial?.letter ?? "",
    extra_points: String(initial?.extra_points ?? 0),
    members: membrosIniciais as number[],
    pick: "",
  });
  // Brasão (Fase F): valor puro fora do react-hook-form — sempre válido.
  const [crest, setCrest] = useState<CrestSpec>(() => crestOf(initial ? { shape: initial.crest_shape, color: initial.crest_color, symbol: initial.crest_symbol } : undefined));
  const { handleSubmit, formState: { isSubmitting: loading }, validationErrors: err, setValidationErrors: setErr } = form;
  const name = form.watch("name");
  const setName = (next: typeof name) => form.setValue("name", next, { shouldDirty: true });
  const letter = form.watch("letter");
  const members = form.watch("members");
  const setMembers = (next: typeof members) => form.setValue("members", next, { shouldDirty: true });
  const extra = form.watch("extra_points");
  const pick = form.watch("pick");
  const setPick = (next: typeof pick) => form.setValue("pick", next, { shouldDirty: true });

  const teamOf = (id: number) => {
    const student = students.find((s) => s.id === id);
    return groups.find((g) => g.id !== initial?.id && g.id === student?.group)?.name;
  };

  async function submit() {
    const x: Record<string, string> = {};
    if (!name.trim()) x["name"] = "Informe o nome do grupo.";
    const extraValue = Number(extra);
    if (!Number.isInteger(extraValue)) x["extra_points"] = "Pontos extras inteiros.";
    setErr(x);
    if (Object.keys(x).length) return;
    const payload = {
      name: name.trim(),
      letter: letter.trim().toLocaleUpperCase("pt-BR") || null,
      extra_points: extraValue,
      ...crestToApi(crest),
    };
    try {
      // 1) ficha da equipe (nome, letra, pontos extras, brasão);
      // 2) membros de uma vez — o servidor move/aloca os alunos.
      const group = initial ? await updateGroup(initial.id, payload) : await createGroup(payload);
      await setGroupMembers(group.id, members);
    } catch (error) {
      const campos = apiFieldErrors(error);
      if (Object.keys(campos).length) {
        setErr(campos);
        return;
      }
      toast.error(apiErrorMessage(error, "Não foi possível salvar o grupo."));
      return;
    }
    toast.success("Grupo salvo.");
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="mt-6 space-y-5" noValidate>
      <Field label="Nome" error={err["name"]}><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Letra (opcional)"><Input aria-label="Letra da equipe (opcional)" maxLength={1} value={letter} onChange={(e) => form.setValue("letter", e.target.value, { shouldDirty: true })} /></Field>
      <Field label="Pontos extras da equipe" error={err["extra_points"]}>
        <Input aria-label="Pontos extras da equipe" type="number" step={1} value={extra} onChange={(e) => form.setValue("extra_points", e.target.value, { shouldDirty: true })} />
      </Field>
      <div className="space-y-2">
        <p className="text-sm font-medium">Brasão</p>
        <CrestPicker value={crest} onChange={setCrest} />
        <p className="text-xs text-muted-foreground">Formato, cor e emblema da equipe — aparece no placar.</p>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">Membros</p>
        <div className="flex gap-2">
          <select className={selectClass} value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">Adicionar aventureiro…</option>
            {students.filter((s) => !members.includes(s.id)).map((s) => <option key={s.id} value={s.id}>{s.name}{teamOf(s.id) ? ` (sai de ${teamOf(s.id)})` : ""}</option>)}
          </select>
          <Button type="button" variant="outline" disabled={!pick} onClick={() => { setMembers([...members, Number(pick)]); setPick(""); }}><Plus /></Button>
        </div>
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
              <span className="flex-1 text-sm">{students.find((s) => s.id === m)?.name}</span>
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9" aria-label="Remover" onClick={() => setMembers(members.filter((x) => x !== m))}><X /></Button>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">Quem sai da lista deixa o grupo ao salvar.</p>
      </div>
      <SubmitButton loading={loading}>Salvar grupo</SubmitButton>
    </form>
  );
}
