"use client";
import { useParams } from "next/navigation";

import { JourneyForm } from "./journey-form";
import { StageForm } from "./stage-form";
import { deleteJourney, getJourneys, getStages, deleteStage } from "@/features/missions/services/journey-service";
import {
  createGroupJourney,
  getGroupJourneys,
  getJourneySummary,
  getStageProgress,
  startBattle,
} from "@/features/missions/services/battle-service";
import { getHeroes, updateHero } from "@/features/heroes/services/hero-service";
import { getGroups } from "@/features/groups/services/group-service";


import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Confirm, EmptyState, PageState, Scroll, Seal, selectClass } from "@/features/journey/components/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiErrorMessage } from "@/lib/api-error";
import { Link, useNavigate } from "@/lib/router-compat";
import type { GroupJourney, Journey, JourneySummary, Stage } from "@/features/missions";
import { ArrowLeft, Pencil, Play, Plus, ScrollText, Trash2, Users } from "@/components/icons/rpg-icons";
import { useMemo, useState } from "react";
import { toast } from "sonner";



function MissionDetail() {
  const { id } = useParams<{ id: string }>();
  const journeyId = Number(id);
  const navigate = useNavigate();

  const journeysQuery = useApiQuery(getJourneys);
  const stagesQuery = useApiQuery((signal) => getStages(journeyId, signal));
  const runsQuery = useApiQuery((signal) => getGroupJourneys(journeyId, signal));
  const progressQuery = useApiQuery(getStageProgress);
  const heroesQuery = useApiQuery(getHeroes);
  const groupsQuery = useApiQuery(getGroups);
  const queries = [journeysQuery, stagesQuery, runsQuery, progressQuery, heroesQuery, groupsQuery];
  const status = queries.some((q) => q.status === "error")
    ? "error"
    : queries.some((q) => q.status === "loading")
      ? "loading"
      : "ready";
  const retry = () => queries.forEach((q) => q.retry());
  const refresh = () => { stagesQuery.refresh(); runsQuery.refresh(); progressQuery.refresh(); heroesQuery.refresh(); groupsQuery.refresh(); };

  const journey: Journey | undefined = journeysQuery.data?.find((j) => j.id === journeyId);
  const stages = stagesQuery.data ?? [];
  const runs = runsQuery.data ?? [];
  const progress = progressQuery.data ?? [];
  const heroes = heroesQuery.data ?? [];
  const groups = groupsQuery.data ?? [];

  const [editingJourney, setEditingJourney] = useState(false);
  const [deletingJourney, setDeletingJourney] = useState(false);
  const [stageForm, setStageForm] = useState<Stage | "new" | null>(null);
  const [deletingStage, setDeletingStage] = useState<Stage | null>(null);
  const [starting, setStarting] = useState<number | null>(null);
  const [addingGroup, setAddingGroup] = useState("");
  const [summary, setSummary] = useState<{ run: GroupJourney; data: JourneySummary } | null>(null);

  // Batalha aberta de cada corrida (o botão vira "continuar").
  const openBattle = (runId: number) => progress.find((p) => p.group_journey === runId && p.status === "PROG");
  const groupsWithoutRun = useMemo(() => {
    const runsList = runsQuery.data ?? [];
    const groupsList = groupsQuery.data ?? [];
    return groupsList.filter((g) => !runsList.some((r) => r.group === g.id));
  }, [runsQuery.data, groupsQuery.data]);

  function start(run: GroupJourney) {
    setStarting(run.id);
    startBattle(run.id).then(
      (state) => navigate({ to: "/missoes/batalha/$id", params: { id: String(state.id) } }),
      (error: unknown) => { toast.error(apiErrorMessage(error, "Não foi possível iniciar a batalha.")); },
    ).finally(() => setStarting(null));
  }

  function openSummary(run: GroupJourney) {
    getJourneySummary(run.id).then(
      (data) => setSummary({ run, data }),
      (error: unknown) => { toast.error(apiErrorMessage(error, "Não foi possível carregar o resumo.")); },
    );
  }

  function addRun() {
    const group = groups.find((g) => g.id === Number(addingGroup));
    if (!group) return;
    createGroupJourney({ group: group.id, journey: journeyId }).then(
      () => { toast.success(`${group.name} entrou na jornada.`); setAddingGroup(""); runsQuery.refresh(); },
      (error: unknown) => { toast.error(apiErrorMessage(error, "Não foi possível inscrever o grupo.")); },
    );
  }

  function assignHero(heroId: number, group: number | null) {
    updateHero(heroId, group === null ? { group: null, journey: null } : { group, journey: journeyId }).then(
      () => { toast.success(group === null ? "Herói devolvido ao catálogo." : "Herói atribuído à corrida."); heroesQuery.refresh(); },
      (error: unknown) => { toast.error(apiErrorMessage(error, "Não foi possível alterar a atribuição.")); },
    );
  }

  return (
    <PageState status={status} retry={retry}>
      <Link to="/missoes" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Missões
      </Link>
      {!journey ? (
        <EmptyState title="Jornada não encontrada" hint="Ela pode ter sido removida do mapa." />
      ) : (
        <>
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-[1.85rem] leading-tight text-foreground">{journey.name}</h1>
              {journey.description && <p className="mt-1.5 max-w-2xl font-reading text-muted-foreground">{journey.description}</p>}
              {!journey.is_active && <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">Jornada inativa</p>}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" aria-label="Editar jornada" onClick={() => setEditingJourney(true)}><Pencil /></Button>
              <Button variant="ghost" size="icon" aria-label="Excluir jornada" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeletingJourney(true)}><Trash2 /></Button>
            </div>
          </div>

          {/* ---------- Etapas ---------- */}
          <section aria-labelledby="stages-title" className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="stages-title" className="text-xl">Etapas</h2>
              <Button size="sm" onClick={() => setStageForm("new")}><Plus /> Nova etapa</Button>
            </div>
            {stages.length === 0 ? (
              <EmptyState title="Sem etapas" hint="Crie ao menos uma etapa com chefes para a batalha começar." />
            ) : (
              <Scroll className="p-0">
                <ul className="divide-y divide-border">
                  {stages.map((stage) => (
                    <li key={stage.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                      <span className="font-display text-sm font-semibold text-muted-foreground">#{stage.order}</span>
                      <div className="min-w-0 flex-1">
                        <p className="break-words font-medium">{stage.name}</p>
                        <p className="break-words text-xs text-muted-foreground">
                          {stage.max_score} pts · {stage.boss_names.length > 0 ? stage.boss_names.join(", ") : "sem chefe no pool"}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" aria-label={`Editar etapa ${stage.name}`} onClick={() => setStageForm(stage)}><Pencil /></Button>
                        <Button variant="ghost" size="icon" aria-label={`Excluir etapa ${stage.name}`} className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeletingStage(stage)}><Trash2 /></Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </Scroll>
            )}
          </section>

          {/* ---------- Corridas dos grupos ---------- */}
          <section aria-labelledby="runs-title" className="mb-10">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 id="runs-title" className="text-xl">Corridas dos grupos</h2>
              {groupsWithoutRun.length > 0 && (
                <div className="flex gap-2">
                  <select aria-label="Grupo para inscrever" className={`${selectClass} w-56`} value={addingGroup} onChange={(e) => setAddingGroup(e.target.value)}>
                    <option value="">Inscrever um grupo…</option>
                    {groupsWithoutRun.map((g) => <option key={g.id} value={g.id}>{g.name}{g.letter ? ` (${g.letter})` : ""}</option>)}
                  </select>
                  <Button size="sm" disabled={!addingGroup} onClick={addRun}><Plus /> Inscrever</Button>
                </div>
              )}
            </div>
            {runs.length === 0 ? (
              <EmptyState title="Nenhum grupo inscrito" hint="Inscreva um grupo para que a corrida comece." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {runs.map((run) => {
                  const aberta = openBattle(run.id);
                  const heroAtivo = heroes.find((h) => h.group === run.group && h.journey === journeyId);
                  return (
                    <Scroll key={run.id} className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg leading-snug">{run.group_name ?? "Grupo"}</h3>
                          <p className="text-xs text-muted-foreground">{run.total_score} pontos</p>
                        </div>
                        <Seal kind={run.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {heroAtivo
                          ? <>Herói: <span className="font-medium text-foreground">{heroAtivo.name}</span>{!heroAtivo.is_active && " (inativo)"}</>
                          : "Sem herói atribuído — a batalha exige um."}
                      </p>
                      <div className="mt-auto flex flex-wrap gap-2">
                        {run.status === "PROG" && (
                          aberta ? (
                            <Button asChild size="sm"><Link to="/missoes/batalha/$id" params={{ id: String(aberta.id) }}><Play /> Continuar batalha</Link></Button>
                          ) : (
                            <Button size="sm" disabled={starting === run.id} onClick={() => start(run)}><Play /> Iniciar batalha</Button>
                          )
                        )}
                        {run.status !== "PROG" && (
                          <Button size="sm" variant="outline" onClick={() => openSummary(run)}><ScrollText /> Resumo</Button>
                        )}
                      </div>
                    </Scroll>
                  );
                })}
              </div>
            )}
          </section>

          {/* ---------- Heróis por corrida ---------- */}
          <section aria-labelledby="heroes-title" className="mb-10">
            <h2 id="heroes-title" className="mb-4 text-xl">Heróis das corridas</h2>
            {runs.length === 0 ? (
              <p className="font-reading text-sm text-muted-foreground">Inscreva um grupo para atribuir um herói.</p>
            ) : (
              <Scroll className="p-0">
                <ul className="divide-y divide-border">
                  {runs.map((run) => (
                    <HeroRow
                      key={run.id}
                      groupLabel={run.group_name ?? "Grupo"}
                      group={run.group}
                      journey={journeyId}
                      heroes={heroes}
                      onAssign={assignHero}
                    />
                  ))}
                </ul>
              </Scroll>
            )}
            <p className="mt-2 text-xs text-muted-foreground">O herói represente a equipe na batalha: um por grupo por jornada.</p>
          </section>

          {/* ---------- Sheets ---------- */}
          <Sheet open={editingJourney} onOpenChange={setEditingJourney}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-md">
              <SheetHeader>
                <SheetTitle className="font-display text-xl">Editar jornada</SheetTitle>
                <SheetDescription className="font-reading">Nome, descrição e disponibilidade.</SheetDescription>
              </SheetHeader>
              <JourneyForm initial={journey} onDone={() => { setEditingJourney(false); journeysQuery.refresh(); }} />
            </SheetContent>
          </Sheet>
          <Sheet open={!!stageForm} onOpenChange={(o) => !o && setStageForm(null)}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
              <SheetHeader>
                <SheetTitle className="font-display text-xl">{stageForm === "new" ? "Nova etapa" : "Editar etapa"}</SheetTitle>
                <SheetDescription className="font-reading">Ordem, pontuação e chefes possíveis.</SheetDescription>
              </SheetHeader>
              {stageForm && <StageForm key={stageForm === "new" ? "n" : stageForm.id} journeyId={journeyId} initial={stageForm === "new" ? null : stageForm} onDone={() => { setStageForm(null); refresh(); }} />}
            </SheetContent>
          </Sheet>
          <SummarySheet summary={summary} onClose={() => setSummary(null)} />
          <Confirm open={deletingJourney} onOpenChange={setDeletingJourney} title="Excluir jornada?" description={`A jornada ${journey.name} e suas etapas e corridas serão apagadas.`} confirmLabel="Excluir" destructive
            onConfirm={() => {
              deleteJourney(journey.id).then(
                () => { toast.success("Jornada removida."); navigate({ to: "/missoes" }); },
                (error: unknown) => { toast.error(apiErrorMessage(error, "Não foi possível excluir a jornada.")); },
              );
            }} />
          <Confirm open={!!deletingStage} onOpenChange={(o) => !o && setDeletingStage(null)} title="Excluir etapa?" description={`A etapa ${deletingStage?.name} será removida da jornada.`} confirmLabel="Excluir" destructive
            onConfirm={() => {
              if (!deletingStage) return;
              deleteStage(deletingStage.id).then(
                () => { toast.success("Etapa removida."); setDeletingStage(null); refresh(); },
                (error: unknown) => { toast.error(apiErrorMessage(error, "Não foi possível excluir a etapa.")); },
              );
            }} />
        </>
      )}
    </PageState>
  );
}

/** Linha de atribuição: herói atual da corrida ou seleção de um avulso. */
function HeroRow({
  groupLabel, group, journey, heroes, onAssign,
}: {
  groupLabel: string;
  group: number;
  journey: number;
  heroes: { id: number; name: string; group: number | null; journey: number | null; is_active: boolean }[];
  onAssign: (heroId: number, group: number | null) => void;
}) {
  const [pick, setPick] = useState("");
  const current = heroes.find((h) => h.group === group && h.journey === journey);
  const candidates = heroes.filter((h) => h.group === null && h.is_active);
  return (
    <li className="flex flex-wrap items-center gap-3 px-5 py-3">
      <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 break-words font-medium">{groupLabel}</span>
      {current ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{current.name}{!current.is_active && " (inativo)"}</span>
          <Button size="sm" variant="outline" onClick={() => onAssign(current.id, null)}>Devolver</Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <select aria-label={`Herói para ${groupLabel}`} className={`${selectClass} h-9 w-48`} value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="" disabled>Escolher herói…</option>
            {candidates.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <Button size="sm" disabled={!pick} onClick={() => { onAssign(Number(pick), group); setPick(""); }}>Atribuir</Button>
        </div>
      )}
    </li>
  );
}

/** Folha do resumo final: etapas, nota sugerida e desempenho por aluno. */
function SummarySheet({ summary, onClose }: { summary: { run: GroupJourney; data: JourneySummary } | null; onClose: () => void }) {
  return (
    <Sheet open={!!summary} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">Resumo — {summary?.run.group_name ?? ""}</SheetTitle>
          <SheetDescription className="font-reading">Nota sugerida ao professor e desempenho por etapa e por aluno.</SheetDescription>
        </SheetHeader>
        {summary && (
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Pontuação</p>
                <p className="font-display text-lg font-semibold">{summary.data.total_score} / {summary.data.max_score}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Nota sugerida</p>
                <p className="font-display text-lg font-semibold">{summary.data.suggested_grade.toFixed(2)}</p>
              </div>
              <Seal kind={summary.data.status} />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Etapas</p>
              <ul className="space-y-1.5">
                {summary.data.stages.map((stage) => (
                  <li key={stage.stage} className="flex items-center gap-2 text-sm">
                    <span className="w-8 text-muted-foreground">#{stage.order}</span>
                    <span className="flex-1 break-words">{stage.name}</span>
                    <span className="text-muted-foreground">{stage.score ?? "—"} / {stage.max_score}</span>
                    {stage.status && <Seal kind={stage.status} />}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Alunos</p>
              <ul className="space-y-1.5">
                {summary.data.students.map((student) => (
                  <li key={student.id} className="flex items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1 break-words">{student.name}</span>
                    <span className="text-muted-foreground">{student.correct}/{student.answered} · {student.points} pts</span>
                    <span className="w-12 text-right font-display font-semibold">{student.grade !== null ? student.grade.toFixed(2) : "—"}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}



export { MissionDetail as MissionDetailsPage };
