"use client";

import { SkillForm } from "./skill-form";
import { deleteSkill, getSkills } from "@/features/skills/services/skill-service";
import { getHeroes } from "@/features/heroes/services/hero-service";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SkillCard } from "@/features/journey/components/skill-card";
import { Confirm, EmptyState, PageHeader, PageState } from "@/features/journey/components/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiErrorMessage } from "@/lib/api-error";
import type { Skill } from "@/features/skills";
import { Pencil, Plus, Trash2 } from "@/components/icons/rpg-icons";
import { useState } from "react";
import { toast } from "sonner";



function Habilidades() {
  const skillsQuery = useApiQuery(getSkills);
  const heroesQuery = useApiQuery(getHeroes);
  const queries = [skillsQuery, heroesQuery];
  // O dono de cada habilidade vem dos heróis: as duas queries juntas.
  const status = queries.some((q) => q.status === "error")
    ? "error"
    : queries.some((q) => q.status === "loading")
      ? "loading"
      : "ready";
  const retry = () => queries.forEach((q) => q.retry());
  const skills = skillsQuery.data ?? [];
  const heroes = heroesQuery.data ?? [];
  const [editing, setEditing] = useState<Skill | "new" | null>(null);
  const [del, setDel] = useState<Skill | null>(null);
  // O dono é derivado do backend: quais heróis têm a habilidade em `spells`.
  const owner = (id: number) => heroes.filter((h) => h.spells.includes(id)).map((h) => h.name).join(", ");

  return (
    <PageState status={status} retry={retry}>
      <PageHeader title="Habilidades" description="Cada carta custa 2, 3 ou 5 pontos de recurso, ganhos nas perguntas." action={<Button onClick={() => setEditing("new")}><Plus /> Nova habilidade</Button>} />
      {skills.length === 0 ? (
        <EmptyState title="O grimório está vazio" hint="Crie habilidades e atribua-as aos heróis." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((s) => (
            <SkillCard key={s.id} skill={s}>
              <div className="mt-auto flex items-center justify-between border-t border-border pt-2">
                <span className="text-xs text-muted-foreground">{owner(s.id) || "Sem herói"}</span>
                <div className="flex">
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Editar" onClick={() => setEditing(s)}><Pencil /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" aria-label="Excluir" onClick={() => setDel(s)}><Trash2 /></Button>
                </div>
              </div>
            </SkillCard>
          ))}
        </div>
      )}
      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-display text-xl">{editing === "new" ? "Nova habilidade" : "Editar habilidade"}</SheetTitle>
            <SheetDescription className="font-reading">Dados no formato XdY, por exemplo 2d10 ou 1d12+5.</SheetDescription>
          </SheetHeader>
          {editing && <SkillForm key={editing === "new" ? "n" : editing.id} initial={editing === "new" ? null : editing} onDone={() => { setEditing(null); skillsQuery.refresh(); }} />}
        </SheetContent>
      </Sheet>
      <Confirm open={!!del} onOpenChange={(o) => !o && setDel(null)} title="Excluir habilidade?" description={`${del?.name} será removida do grimório e dos heróis.`} confirmLabel="Excluir" destructive
        onConfirm={() => {
          if (!del) return;
          deleteSkill(del.id).then(
            () => { toast.success("Habilidade removida."); setDel(null); skillsQuery.refresh(); },
            (error: unknown) => { toast.error(apiErrorMessage(error, "Não foi possível remover a habilidade.")); },
          );
        }} />
    </PageState>
  );
}



export { Habilidades as SkillsPage };
