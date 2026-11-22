"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, SubmitButton } from "@/features/journey/components/ui";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { apiErrorMessage, apiFieldErrors } from "@/lib/api-error";
import { getBosses } from "@/features/bosses/services/boss-service";
import { createStage, updateStage } from "@/features/missions/services/journey-service";
import { useApiQuery } from "@/hooks/use-api-query";
import type { Stage } from "@/features/missions";
import { toast } from "sonner";

/**
 * Form da etapa: ordem, nome, pontuação máxima e o **pool de chefes**
 * (o servidor sorteia um chefe ativo e jogável desse pool na batalha).
 */
export function StageForm({ journeyId, initial, onDone }: { journeyId: number; initial: Stage | null; onDone: () => void }) {
  const bossesQuery = useApiQuery(getBosses);
  const bosses = bossesQuery.data ?? [];
  const form = useValidatedForm({
    f: {
      order: String(initial?.order ?? ""),
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      max_score: String(initial?.max_score ?? 100),
    },
    boss_pool: (initial?.boss_pool ?? []) as number[],
  });
  const { handleSubmit, formState: { isSubmitting: loading }, validationErrors: err, setValidationErrors: setErr } = form;
  const f = form.watch("f");
  const setF = (next: typeof f) => form.setValue("f", next, { shouldDirty: true });
  const bossPool = form.watch("boss_pool");
  const setBossPool = (next: typeof bossPool) => form.setValue("boss_pool", next, { shouldDirty: true });

  async function submit() {
    const x: Record<string, string> = {};
    const order = Number(f.order);
    if (!Number.isInteger(order) || order < 1) x["order"] = "Ordem inteira a partir de 1.";
    if (!f.name.trim()) x["name"] = "Informe o nome da etapa.";
    const maxScore = Number(f.max_score);
    if (!Number.isInteger(maxScore) || maxScore < 1) x["max_score"] = "Pontuação inteira maior que zero.";
    if (bossPool.length === 0) x["boss_pool"] = "Escolha ao menos um chefe.";
    setErr(x);
    if (Object.keys(x).length) return;
    const payload = {
      journey: journeyId,
      order,
      name: f.name.trim(),
      description: f.description.trim(),
      max_score: maxScore,
      boss_pool: bossPool,
    };
    try {
      if (initial) await updateStage(initial.id, payload);
      else await createStage(payload);
    } catch (error) {
      const campos = apiFieldErrors(error);
      if (Object.keys(campos).length) {
        setErr(campos);
        return;
      }
      toast.error(apiErrorMessage(error, "Não foi possível salvar a etapa."));
      return;
    }
    toast.success("Etapa salva.");
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="mt-6 space-y-4" noValidate>
      <div className="grid grid-cols-[100px_1fr] gap-3">
        <Field label="Ordem" error={err["order"]}>
          <Input type="number" min={1} value={f.order} onChange={(e) => setF({ ...f, order: e.target.value })} />
        </Field>
        <Field label="Nome" error={err["name"]}>
          <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </Field>
      </div>
      <Field label="Descrição"><Textarea rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
      <Field label="Pontuação máxima" error={err["max_score"]} hint="Pontos que a equipe pode marcar nesta etapa.">
        <Input type="number" min={1} value={f.max_score} onChange={(e) => setF({ ...f, max_score: e.target.value })} />
      </Field>
      <div className="space-y-2">
        <p className="text-sm font-medium">Chefes possíveis</p>
        {err["boss_pool"] && <p className="text-xs text-destructive">{err["boss_pool"]}</p>}
        <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-2">
          {bosses.length === 0 && <p className="px-1 py-2 text-xs text-muted-foreground">Nenhum chefe cadastrado.</p>}
          {bosses.map((boss) => (
            <label key={boss.id} className="flex cursor-pointer items-center gap-3 rounded px-2 py-1.5 text-sm hover:bg-accent">
              <Checkbox
                checked={bossPool.includes(boss.id)}
                onCheckedChange={(c) => setBossPool(c ? [...bossPool, boss.id] : bossPool.filter((x) => x !== boss.id))}
              />
              <span className="flex-1">{boss.name}</span>
              {!boss.is_active && <span className="text-xs text-muted-foreground">fora do sorteio</span>}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Na batalha o servidor sorteia um chefe ativo, com perguntas válidas, deste pool.</p>
      </div>
      <SubmitButton loading={loading}>Salvar etapa</SubmitButton>
    </form>
  );
}
