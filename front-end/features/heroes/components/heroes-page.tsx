"use client";

import { HeroForm } from "./hero-form";
import { deleteHero, getHeroes } from "@/features/heroes/services/hero-service";
import { getSkills } from "@/features/skills/services/skill-service";
import { apiErrorMessage } from "@/lib/api-error";
import { toast } from "sonner";


import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SkillCard } from "@/features/journey/components/skill-card";
import { Confirm, EmptyState, PageHeader, PageState, Scroll } from "@/features/journey/components/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import type { Hero } from "@/features/heroes";
import { Pencil, Plus, Shield, Trash2 } from "@/components/icons/rpg-icons";
import { Crest } from "@/features/journey/components/crest";
import { useState } from "react";



function Attr({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="font-display text-xl font-semibold">{value}</p>
      <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

function Herois() {
  const heroesQuery = useApiQuery(getHeroes);
  const skillsQuery = useApiQuery(getSkills);
  const queries = [heroesQuery, skillsQuery];
  // Os cards de habilidade vêm do grimório: as duas queries juntas.
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
          <Scroll key={h.id} className="flex flex-col gap-4 p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-success/60 bg-accent">
                  {h.role === "Ataque" ? <Crest className="h-5 w-5" /> : <Shield className="h-5 w-5 text-accent-foreground" />}
                </div>
                <div>
                  <h3 className="text-xl leading-tight">{h.name}</h3>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">{h.hero_class} · {h.role}</p>
                </div>
              </div>
              <div className="flex"><Button variant="ghost" size="icon" aria-label={`Editar ${h.name}`} onClick={() => setEditing(h)}><Pencil /></Button><Button variant="ghost" size="icon" aria-label={`Excluir ${h.name}`} onClick={() => setDeleting(h)}><Trash2 /></Button></div>
            </div>
            <p className="font-reading text-sm leading-relaxed">{h.description}</p>
            <div className="grid grid-cols-3 rounded-md border border-border bg-secondary/40 py-2">
              <Attr label="Força" value={h.attributes.forca} />
              <Attr label="Sabedoria" value={h.attributes.sabedoria} />
              <Attr label="Carisma" value={h.attributes.carisma} />
            </div>
            <p className="text-sm"><span className="font-display font-semibold">Passiva: </span><span className={h.passive.includes("[revisar]") ? "font-reading italic text-muted-foreground" : "font-reading"}>{h.passive}</span></p>
            <div className="grid gap-2">
              {skills.filter((s) => h.spells.includes(s.id)).sort((a, b) => a.cost - b.cost).map((s) => <SkillCard key={s.id} skill={s} />)}
              {h.spells.length === 0 && <p className="font-reading text-sm text-muted-foreground">Nenhuma habilidade atribuída.</p>}
            </div>
          </Scroll>
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
