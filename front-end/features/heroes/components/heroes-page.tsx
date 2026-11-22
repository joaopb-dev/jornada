"use client";

import { HeroForm } from "./hero-form";
import { deleteHero, getHeroes, updateHero } from "@/features/heroes/services/hero-service";
import { getSkills } from "@/features/skills/services/skill-service";
import { apiErrorMessage } from "@/lib/api-error";
import { toast } from "sonner";


import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Confirm, EmptyState, PageHeader, PageState, Scroll } from "@/features/journey/components/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import type { Hero } from "@/features/heroes";
import type { Skill } from "@/features/skills";
import { Dices, Pencil, Plus, Shield, Trash2 } from "@/components/icons/rpg-icons";
import { Crest } from "@/features/journey/components/crest";
import { SKILL_TYPE_LABEL } from "@/features/journey/components/skill-card";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";



function Attr({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="font-display text-xl font-semibold">{value}</p>
      <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

/** Cartão do herói — mesma composição do card de chefes: identidade,
 * linha de atributos, arte (com reserva de escudo), ficha e habilidades. */
function HeroCard({
  hero,
  skills,
  onEdit,
  onDelete,
  onToggle,
}: {
  hero: Hero;
  skills: Skill[];
  onEdit: (hero: Hero) => void;
  onDelete: (hero: Hero) => void;
  onToggle: (hero: Hero, active: boolean) => void;
}) {
  const [failed, setFailed] = useState(false);
  const kit = skills.filter((s) => hero.spells.includes(s.id)).sort((a, b) => a.cost - b.cost);

  return (
    <Scroll className={cn("flex flex-col", !hero.is_active && "opacity-70")}>
      {/* Identidade (emblema + nome + selo), como no card dos chefes */}
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-success/60 bg-accent">
          {hero.role === "Ataque" ? <Crest className="h-5 w-5" /> : <Shield className="h-5 w-5 text-accent-foreground" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">
            {hero.is_active ? "Herói da jornada" : "Herói inativo"}
          </p>
          <h3 className="truncate font-display text-xl text-foreground">{hero.name}</h3>
          <p className="truncate text-xs text-muted-foreground">{hero.hero_class} · {hero.role}</p>
        </div>
        <div className="flex shrink-0 gap-0.5">
          <Button variant="ghost" size="icon" aria-label={`Editar ${hero.name}`} onClick={() => onEdit(hero)}><Pencil /></Button>
          <Button variant="ghost" size="icon" aria-label={`Excluir ${hero.name}`} onClick={() => onDelete(hero)}><Trash2 /></Button>
        </div>
      </div>

      {/* Atributos — a linha de stats ocupa o lugar da barra de PV */}
      <div className="mt-3 grid grid-cols-3 rounded-md border border-border bg-secondary/40 py-2">
        <Attr label="Força" value={hero.attributes.forca} />
        <Attr label="Sabedoria" value={hero.attributes.sabedoria} />
        <Attr label="Carisma" value={hero.attributes.carisma} />
      </div>

      {/* Arte do herói */}
      <div className="relative mt-3 h-44 w-full overflow-hidden rounded-md border border-border bg-muted">
        {hero.image && !failed ? (
          <Image
            src={hero.image} alt={hero.name} fill unoptimized
            className="object-cover" onError={() => setFailed(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center" aria-hidden>
            <Shield className="h-14 w-14 text-muted-foreground/40" strokeWidth={1} />
          </div>
        )}
      </div>

      {/* Ficha + habilidades */}
      <div className="mt-3 flex flex-1 flex-col gap-3">
        <p className="font-reading text-sm text-foreground">{hero.description}</p>
        {hero.passive && (
          <p className="text-sm">
            <span className="font-display font-semibold">Passiva: </span>
            <span className={hero.passive.includes("[revisar]") ? "font-reading italic text-muted-foreground" : "font-reading"}>{hero.passive}</span>
          </p>
        )}

        <ul className="space-y-2 border-t border-border pt-3">
          {kit.map((s) => (
            <li key={s.id} className="rounded-md border border-border/60 bg-background px-3 py-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-sm font-medium text-foreground">{s.name}</p>
                <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[0.65rem] text-muted-foreground">{s.cost} PR</span>
                <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[0.65rem] text-accent-foreground">{SKILL_TYPE_LABEL[s.spell_type]}</span>
                <span className="inline-flex items-center gap-1 text-[0.65rem] text-muted-foreground"><Dices className="h-3 w-3" aria-hidden />{s.dice}</span>
              </div>
              <p className="mt-1 font-reading text-xs leading-relaxed text-muted-foreground">{s.description}</p>
            </li>
          ))}
        </ul>
        {kit.length === 0 && <p className="font-reading text-sm text-muted-foreground">Nenhuma habilidade atribuída.</p>}

        <label className="mt-auto flex items-center justify-between rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-foreground">
          <span>{hero.is_active ? "Disponível para escolha" : "Fora de escolha"}</span>
          <Switch checked={hero.is_active} onCheckedChange={(c) => onToggle(hero, c)} />
        </label>
      </div>
    </Scroll>
  );
}

function Herois() {
  const heroesQuery = useApiQuery(getHeroes);
  const skillsQuery = useApiQuery(getSkills);
  const queries = [heroesQuery, skillsQuery];
  // Os kits de habilidade vêm do grimório: as duas queries juntas.
  const status = queries.some((q) => q.status === "error")
    ? "error"
    : queries.some((q) => q.status === "loading")
      ? "loading"
      : "ready";
  const retry = () => queries.forEach((q) => q.retry());
  const heroes = heroesQuery.data ?? [];
  const skills = skillsQuery.data ?? [];
  const [editing, setEditing] = useState<Hero | "new" | null>(null);
  const [deleting, setDeleting] = useState<Hero | null>(null);

  return (
    <PageState status={status} retry={retry}>
      <PageHeader title="Heróis" description="Cada grupo escolhe um herói por missão. Ataque fere o chefe; suporte protege a Aliança." action={<Button onClick={() => setEditing("new")}><Plus /> Novo herói</Button>} />
      {heroes.length === 0 && <EmptyState title="Nenhum herói cadastrado" hint="Cadastre o primeiro herói." />}
      <div className="grid gap-6 md:grid-cols-2">
        {heroes.map((h) => (
          <HeroCard
            key={h.id}
            hero={h}
            skills={skills}
            onEdit={setEditing}
            onDelete={setDeleting}
            onToggle={(hero, active) => {
              updateHero(hero.id, { is_active: active }).then(
                () => {
                  toast.success(active ? `${hero.name} disponível para escolha.` : `${hero.name} fora de escolha.`);
                  heroesQuery.refresh();
                },
                (error: unknown) => { toast.error(apiErrorMessage(error, "Não foi possível alterar a disponibilidade do herói.")); },
              );
            }}
          />
        ))}
      </div>
      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-display text-xl">{editing === "new" ? "Novo herói" : `Editar ${editing?.name}`}</SheetTitle>
            <SheetDescription className="font-reading">Ficha e habilidades atribuídas.</SheetDescription>
          </SheetHeader>
          {editing && <HeroForm key={editing === "new" ? "n" : editing.id} hero={editing === "new" ? null : editing} skills={skills} onDone={() => { setEditing(null); heroesQuery.refresh(); }} />}
        </SheetContent>
      </Sheet>
      <Confirm open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)} title="Excluir herói?" description={deleting?.name ?? ""} confirmLabel="Excluir" destructive
        onConfirm={() => {
          if (!deleting) return;
          deleteHero(deleting.id).then(
            () => { toast.success("Herói removido."); setDeleting(null); heroesQuery.refresh(); },
            (error: unknown) => { toast.error(apiErrorMessage(error, "Não foi possível remover o herói.")); },
          );
        }} />
    </PageState>
  );
}



export { Herois as HeroesPage };
