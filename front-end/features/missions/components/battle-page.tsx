"use client";
import { useParams } from "next/navigation";

import { answerBattle, getBattle } from "@/features/missions/services/battle-service";
import { getStudents } from "@/features/students/services/student-service";


import { Button } from "@/components/ui/button";
import { EmptyState, HpBar, PageState, Scroll, selectClass } from "@/features/journey/components/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiErrorMessage } from "@/lib/api-error";
import { Link } from "@/lib/router-compat";
import { cn } from "@/lib/utils";
import type { BattleState } from "@/features/missions";
import { ArrowLeft, Check, Heart, RefreshCw, Skull, X } from "@/components/icons/rpg-icons";
import { useState } from "react";
import { toast } from "sonner";



function Batalha() {
  const { id } = useParams<{ id: string }>();
  const progressId = Number(id);
  const query = useApiQuery((signal) => getBattle(progressId, signal));
  const studentsQuery = useApiQuery(getStudents);
  // A resposta da pergunta já devolve o estado novo — não precisa de refetch.
  const [override, setOverride] = useState<BattleState | null>(null);
  const state = override ?? query.data;
  const students = studentsQuery.data ?? [];

  const [choice, setChoice] = useState<number | null>(null);
  const [student, setStudent] = useState("");
  const [spell, setSpell] = useState("");
  const [sending, setSending] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  // A troca de pergunta só acontece por resposta/recarga — logo a limpeza
  // das seleções vive nos handlers (não há efeito nem polling aqui).
  const reload = () => {
    setOverride(null);
    setChoice(null);
    setSpell("");
    setLastCorrect(null);
    query.retry();
  };

  function answer() {
    if (!state || choice === null) return;
    setSending(true);
    answerBattle(state.id, {
      choice,
      student: student ? Number(student) : null,
      spell: spell ? Number(spell) : null,
    }).then(
      (result) => {
        setOverride(result.state);
        setLastCorrect(result.correct);
        setChoice(null); // a resposta já veio com a próxima pergunta
        setSpell("");
      },
      (error: unknown) => { toast.error(apiErrorMessage(error, "Não foi possível registrar a resposta.")); },
    ).finally(() => setSending(false));
  }

  const status = query.status;
  const groupStudents = state ? students.filter((s) => s.group === state.group_journey.group) : [];
  const readySpells = state?.spells.filter((s) => s.ready) ?? [];
  const coolingSpells = state?.spells.filter((s) => !s.ready) ?? [];
  const finished = state ? state.status !== "PROG" : false;
  const victory = state?.status === "DONE";

  return (
    <PageState status={status} retry={query.retry}>
      {!state ? (
        <EmptyState title="Batalha não encontrada" hint="Ela pode ter sido encerrada." />
      ) : (
        <>
          <Link to="/missoes/$id" params={{ id: String(state.group_journey.journey) }} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar à jornada
          </Link>

          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{state.group_journey.group_name} · Etapa #{state.stage.order}</p>
              <h1 className="text-[1.85rem] leading-tight text-foreground">{state.stage.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Turno {state.turn} · {state.score} pontos</p>
            </div>
            <Button variant="outline" size="sm" onClick={reload}><RefreshCw /> Atualizar</Button>
          </div>

          {finished && (
            <div className={cn("mb-6 rounded-md border px-4 py-3", victory ? "border-success/50 bg-accent text-accent-foreground" : "border-destructive/50 bg-destructive/10 text-destructive")}>
              <p className="font-display text-lg font-semibold">{victory ? "Missão cumprida!" : "A equipe recuou."}</p>
              <p className="text-sm">{state.score} pontos nesta etapa.</p>
            </div>
          )}

          {/* ---------- Lado a lado: herói vs chefe ---------- */}
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <Scroll className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-success/60 bg-accent"><Heart className="h-4 w-4 text-accent-foreground" /></span>
                <div>
                  <p className="font-display font-semibold">{state.hero.name ?? "Sem herói"}</p>
                  <p className="text-xs text-muted-foreground">Escudo {state.hero.shield} · Poder +{state.hero.power_bonus}</p>
                </div>
              </div>
              <HpBar hp={Math.max(0, state.hero.hp)} max={state.hero.max_hp} />
            </Scroll>
            <Scroll className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-destructive/50 bg-destructive/10"><Skull className="h-4 w-4 text-destructive" /></span>
                <div>
                  <p className="font-display font-semibold">{state.boss.name}</p>
                  <p className="text-xs text-muted-foreground">Escudo {state.boss.shield}</p>
                </div>
              </div>
              <HpBar hp={Math.max(0, state.boss.hp)} max={state.boss.max_hp} />
            </Scroll>
          </div>

          {/* ---------- Pergunta ---------- */}
          {!finished && !state.question && (
            <Scroll><p className="font-reading text-muted-foreground">Sem pergunta pendente — clique em Atualizar.</p></Scroll>
          )}
          {!finished && state.question && (
            <Scroll className="mb-6">
              <p className="font-reading text-base">{state.question.text}</p>
              <p className="mt-1 text-xs text-muted-foreground">{state.question.points} pontos de dano ao acertar</p>
              <div className="mt-4 grid gap-2">
                {state.question.choices.map((c) => (
                  <button
                    key={c.id} type="button"
                    onClick={() => setChoice(c.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-3 py-2.5 text-left text-sm transition-colors",
                      choice === c.id ? "border-success bg-accent text-accent-foreground" : "border-border hover:bg-accent/50",
                    )}
                  >
                    {choice === c.id ? <Check className="h-4 w-4 shrink-0" /> : <span className="h-4 w-4 shrink-0 rounded-full border border-input" aria-hidden />}
                    {c.text}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">Aluno (opcional)</span>
                  <select className={selectClass} value={student} onChange={(e) => setStudent(e.target.value)}>
                    <option value="">Quem responde?</option>
                    {groupStudents.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">Feitiço (opcional)</span>
                  <select className={selectClass} value={spell} onChange={(e) => setSpell(e.target.value)}>
                    <option value="">Sem feitiço</option>
                    {readySpells.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
              </div>
              {coolingSpells.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Em recarga: {coolingSpells.map((s) => `${s.name} (${s.cooldown_left})`).join(", ")}
                </p>
              )}

              <div className="mt-4 flex items-center gap-3">
                <Button onClick={answer} disabled={choice === null || sending}>{sending ? "Registrando…" : "Responder"}</Button>
                {lastCorrect !== null && (
                  <span className={cn("text-sm font-medium", lastCorrect ? "text-accent-foreground" : "text-destructive")}>
                    {lastCorrect ? "Acertou!" : "Errou — o chefe responde."}
                  </span>
                )}
              </div>
            </Scroll>
          )}

          {/* ---------- Log de eventos ---------- */}
          <section aria-labelledby="events-title">
            <h2 id="events-title" className="mb-3 text-xl">Histórico da batalha</h2>
            {state.events.length === 0 ? (
              <p className="font-reading text-sm text-muted-foreground">Nenhum evento ainda.</p>
            ) : (
              <Scroll className="p-0">
                <ul className="divide-y divide-border">
                  {[...state.events].reverse().map((event) => {
                    const responder = students.find((s) => s.id === event.student)?.name;
                    return (
                      <li key={event.id} className="flex flex-wrap items-center gap-2 px-5 py-2.5 text-sm">
                        <span className="w-14 text-xs text-muted-foreground">Turno {event.turn}</span>
                        <span className="min-w-0 flex-1 break-words">
                          {event.actor === "BOS"
                            ? `Chefe${event.spell_name ? ` · ${event.spell_name}` : ""}`
                            : `${responder ?? "Equipe"}${event.question !== null ? " respondeu" : ""}${event.spell_name ? ` · ${event.spell_name}` : ""}`}
                        </span>
                        {event.answered_correctly !== null && (
                          event.answered_correctly
                            ? <Check className="h-4 w-4 shrink-0 text-accent-foreground" />
                            : <X className="h-4 w-4 shrink-0 text-destructive" />
                        )}
                        {event.value !== null && <span className="font-display text-xs font-semibold">{event.value}</span>}
                      </li>
                    );
                  })}
                </ul>
              </Scroll>
            )}
          </section>
        </>
      )}
    </PageState>
  );
}



export { Batalha as BattlePage };
