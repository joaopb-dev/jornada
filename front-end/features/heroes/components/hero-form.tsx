"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, SubmitButton, selectClass } from "@/features/journey/components/ui";
import { useValidatedForm } from "@/hooks/use-validated-form";
import { apiErrorMessage, apiFieldErrors } from "@/lib/api-error";
import { createHero, updateHero } from "@/features/heroes/services/hero-service";
import { imageUrlSchema } from "@/features/bosses/schemas/boss";
import type { Hero } from "@/features/heroes";
import type { Skill } from "@/features/skills";
import { toast } from "sonner";

export function HeroForm({ hero, skills, onDone }: { hero: Hero | null; skills: Skill[]; onDone: () => void }) {
  const form = useValidatedForm({ f: {
    name: hero?.name ?? "",
    image: hero?.image ?? "",
    hero_class: hero?.hero_class ?? "",
    role: hero?.role ?? ("Ataque" as Hero["role"]),
    description: hero?.description ?? "",
    passive: hero?.passive ?? "",
    spells: hero?.spells ?? ([] as number[]),
    attrs: { forca: String(hero?.attributes.forca ?? 0), sabedoria: String(hero?.attributes.sabedoria ?? 0), carisma: String(hero?.attributes.carisma ?? 0) },
  } });
  const { handleSubmit, formState: { isSubmitting: loading }, validationErrors: err, setValidationErrors: setErr } = form;
  const f = form.watch("f");
  const setF = (next: typeof f) => form.setValue("f", next, { shouldDirty: true });

  async function submit() {
    const x: Record<string, string> = {};
    if (!f.name.trim()) x["name"] = "Informe o nome.";
    if (!f.hero_class.trim()) x["hero_class"] = "Informe a classe.";
    if (!imageUrlSchema.safeParse(f.image).success) x["image"] = "Use caminho local ou URL HTTPS.";
    if (!f.description.trim()) x["description"] = "Informe a descrição.";
    (["forca", "sabedoria", "carisma"] as const).forEach((k) => { const v = Number(f.attrs[k]); if (!Number.isInteger(v) || v < 0 || v > 5) x[k] = "0 a 5"; });
    setErr(x);
    if (Object.keys(x).length) return;
    const payload = {
      name: f.name.trim(),
      image: f.image.trim(),
      hero_class: f.hero_class.trim(),
      role: f.role,
      description: f.description.trim(),
      passive: f.passive,
      spells: f.spells,
      attributes: { forca: Number(f.attrs.forca), sabedoria: Number(f.attrs.sabedoria), carisma: Number(f.attrs.carisma) },
      // Modelo avulso do catálogo: o vínculo com corrida é papel da tela
      // de Missões (group+journey explícitos no create).
      group: null as number | null,
      journey: null as number | null,
    };
    try {
      if (hero) await updateHero(hero.id, payload);
      else await createHero(payload);
    } catch (error) {
      const campos = apiFieldErrors(error);
      if (Object.keys(campos).length) {
        setErr(campos);
        return;
      }
      toast.error(apiErrorMessage(error, "Não foi possível salvar a ficha do herói."));
      return;
    }
    toast.success("Ficha do herói atualizada.");
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="mt-6 space-y-4" noValidate>
      <Field label="Nome" error={err["name"]}><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Classe" error={err["hero_class"]}><Input value={f.hero_class} onChange={(e) => setF({ ...f, hero_class: e.target.value })} /></Field>
      <Field label="Função"><select aria-label="Função do herói" className={selectClass} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Hero["role"] })}><option>Ataque</option><option>Suporte</option></select></Field>
      <Field label="Imagem (caminho local ou URL HTTPS)" error={err["image"]}>
        <Input value={f.image} onChange={(e) => setF({ ...f, image: e.target.value })} placeholder="/personagens/jasper.jpg" />
      </Field>
      <Field label="Descrição" error={err["description"]}><Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
      <Field label="Passiva"><Textarea rows={2} value={f.passive} onChange={(e) => setF({ ...f, passive: e.target.value })} /></Field>
      <div className="grid grid-cols-3 gap-3">
        {(["forca", "sabedoria", "carisma"] as const).map((k) => (
          <Field key={k} label={k === "forca" ? "Força" : k === "sabedoria" ? "Sabedoria" : "Carisma"} error={err[k]}>
            <Input type="number" min={0} max={5} value={f.attrs[k]} onChange={(e) => setF({ ...f, attrs: { ...f.attrs, [k]: e.target.value } })} />
          </Field>
        ))}
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">Habilidades</p>
        <div className="max-h-72 space-y-1 overflow-y-auto rounded-md border border-border p-2">
          {skills.map((s) => (
            <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded px-2 py-1.5 text-sm hover:bg-accent">
              <Checkbox checked={f.spells.includes(s.id)} onCheckedChange={(c) => setF({ ...f, spells: c ? [...f.spells, s.id] : f.spells.filter((x) => x !== s.id) })} />
              <span className="flex-1">{s.name}</span>
              <span className="text-xs text-muted-foreground">{s.cost} PR · {s.dice}</span>
            </label>
          ))}
        </div>
      </div>
      <SubmitButton loading={loading}>Salvar ficha</SubmitButton>
    </form>
  );
}
