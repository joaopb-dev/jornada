"use client";

import { JourneyForm } from "./journey-form";
import { deleteJourney, getJourneys, getStages } from "@/features/missions/services/journey-service";


import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Confirm, EmptyState, PageHeader, PageState, Scroll } from "@/features/journey/components/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiErrorMessage } from "@/lib/api-error";
import { Link } from "@/lib/router-compat";
import type { Journey } from "@/features/missions";
import { CalendarDays, Pencil, Plus, Trash2 } from "@/components/icons/rpg-icons";
import { useMemo, useState } from "react";
import { toast } from "sonner";



function Missoes() {
  const journeysQuery = useApiQuery(getJourneys);
  const stagesQuery = useApiQuery((signal) => getStages(undefined, signal));
  const queries = [journeysQuery, stagesQuery];
  // A contagem de etapas vem de outra query: a página só renderiza com as duas.
  const status = queries.some((q) => q.status === "error")
    ? "error"
    : queries.some((q) => q.status === "loading")
      ? "loading"
      : "ready";
  const retry = () => queries.forEach((q) => q.retry());
  const journeys = journeysQuery.data ?? [];
  const [editing, setEditing] = useState<Journey | "new" | null>(null);
  const [del, setDel] = useState<Journey | null>(null);
  const stageCount = useMemo(() => {
    const counts = new Map<number, number>();
    for (const stage of stagesQuery.data ?? []) counts.set(stage.journey, (counts.get(stage.journey) ?? 0) + 1);
    return counts;
  }, [stagesQuery.data]);
  const refresh = () => { journeysQuery.refresh(); stagesQuery.refresh(); };

  return (
    <PageState status={status} retry={retry}>
      <PageHeader
        title="Missões"
        description="Cada jornada é uma campanha: etapas em ordem, chefes sorteados e corridas dos grupos."
        action={<div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link to="/agenda"><CalendarDays /> Agenda pública</Link></Button><Button onClick={() => setEditing("new")}><Plus /> Nova jornada</Button></div>}
      />
      {journeys.length === 0 ? (
        <EmptyState title="Nenhuma jornada no mapa" hint="Crie a primeira jornada para as equipes partirem em missões." action={<Button onClick={() => setEditing("new")}><Plus /> Nova jornada</Button>} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {journeys.map((j) => (
            <div key={j.id} className="flex h-full flex-col">
              <Link to="/missoes/$id" params={{ id: String(j.id) }} className="block flex-1">
                <Scroll hover className="flex h-full flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{stageCount.get(j.id) ?? 0} etapas</span>
                    {!j.is_active && <span className="rounded-full border border-border px-2 py-0.5 font-display text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">Inativa</span>}
                  </div>
                  <div>
                    <h3 className="text-lg leading-snug">{j.name}</h3>
                    {j.description && <p className="mt-1 font-reading text-sm text-muted-foreground">{j.description}</p>}
                  </div>
                </Scroll>
              </Link>
              <div className="mt-2 flex justify-end gap-1">
                <Button variant="ghost" size="icon" aria-label={`Editar ${j.name}`} onClick={() => setEditing(j)}><Pencil /></Button>
                <Button variant="ghost" size="icon" aria-label={`Excluir ${j.name}`} className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDel(j)}><Trash2 /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-display text-xl">{editing === "new" ? "Nova jornada" : "Editar jornada"}</SheetTitle>
            <SheetDescription className="font-reading">Nome, descrição e se a jornada está aberta.</SheetDescription>
          </SheetHeader>
          {editing && <JourneyForm key={editing === "new" ? "n" : editing.id} initial={editing === "new" ? null : editing} onDone={() => { setEditing(null); refresh(); }} />}
        </SheetContent>
      </Sheet>
      <Confirm open={!!del} onOpenChange={(o) => !o && setDel(null)} title="Excluir jornada?" description={`A jornada ${del?.name} e suas etapas e corridas serão apagadas.`} confirmLabel="Excluir" destructive
        onConfirm={() => {
          if (!del) return;
          deleteJourney(del.id).then(
            () => { toast.success("Jornada removida."); setDel(null); refresh(); },
            (error: unknown) => { toast.error(apiErrorMessage(error, "Não foi possível excluir a jornada.")); },
          );
        }} />
    </PageState>
  );
}



export { Missoes as MissionsPage };
