"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { PageHeader, PageState } from "@/features/journey/components/ui";
import { Crest, crestFromApi } from "@/features/crest";
import { formatDate } from "@/lib/date-format";
import { CalendarDays, Search } from "@/components/icons/rpg-icons";
import { useAgenda } from "../hooks/use-agenda";

/**
 * Agenda pública de incursões: faixa com as datas das missões + grid de
 * equipes (brasão, aventureiros e a linguagem de cada incursão). O grid
 * cresce por colunas — many equipes não quebram o layout (ADR-023).
 */
export function PublicAgenda({ embedded = false }: { embedded?: boolean }) {
  const { agenda, status, retry } = useAgenda();
  const [query, setQuery] = useState("");

  if (!agenda || status !== "ready") {
    return <PageState status={status} retry={retry}>{null}</PageState>;
  }

  const search = query.trim().toLocaleLowerCase("pt-BR");
  const groups = agenda.groups.filter(
    (group) =>
      !search ||
      group.name.toLocaleLowerCase("pt-BR").includes(search) ||
      group.members.some((member) =>
        `${member.name} ${member.registration}`.toLocaleLowerCase("pt-BR").includes(search),
      ),
  );

  return (
    <section
      id="agenda"
      className={embedded ? "w-full" : "mx-auto w-full max-w-7xl px-5 py-10 md:px-10 md:py-12"}
    >
      <PageHeader
        title="Agenda de incursões"
        description="Datas das missões, equipes e linguagens de cada apresentação."
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Buscar na agenda"
            className="pl-9"
            placeholder="Nome, matrícula ou equipe"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" /> {agenda.incursions.length} incursões ·{" "}
          {agenda.groups.length} equipes
        </span>
      </div>

      {/* Linha do tempo das incursões */}
      {agenda.incursions.length === 0 ? (
        <p className="mb-6 rounded-sm border border-dashed border-border px-4 py-5 text-center font-reading text-sm text-muted-foreground">
          Nenhuma incursão agendada ainda.
        </p>
      ) : (
        <ol className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {agenda.incursions.map((incursion) => (
            <li
              key={incursion.id}
              className="rounded-sm border border-border bg-background/40 p-4"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-display text-xs uppercase tracking-widest text-accent">
                  Incursão {incursion.number}
                </span>
                <time
                  dateTime={incursion.date ?? undefined}
                  className="whitespace-nowrap font-reading text-xs text-muted-foreground"
                >
                  {incursion.date ? formatDate(incursion.date) : "Data a definir"}
                </time>
              </div>
              <p className="mt-1 font-display text-base">{incursion.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {incursion.participations.length}{" "}
                {incursion.participations.length === 1 ? "equipe" : "equipes"}
              </p>
            </li>
          ))}
        </ol>
      )}

      {/* Grid de equipes: brasão + aventureiros + linguagem por incursão */}
      {groups.length === 0 ? (
        <p className="rounded-sm border border-dashed border-border px-4 py-8 text-center font-reading text-sm text-muted-foreground">
          {search ? "Nenhuma equipe ou aventureiro encontrado." : "Nenhuma equipe cadastrada."}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {groups.map((group) => (
            <li
              key={group.id}
              className="flex flex-col gap-3 rounded-sm border border-border bg-background/40 p-4"
            >
              <div className="flex items-center gap-3">
                <Crest spec={crestFromApi(group)} size={40} className="shrink-0" />
                <div className="min-w-0">
                  <p className="truncate font-display text-base">{group.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {group.members.length}{" "}
                    {group.members.length === 1 ? "aventureiro" : "aventureiros"}
                  </p>
                </div>
              </div>

              <ul className="space-y-1 border-t border-border/60 pt-3 text-sm">
                {group.members.map((member) => (
                  <li key={member.id} className="flex items-baseline justify-between gap-2">
                    <span className="truncate">{member.name}</span>
                    <span className="shrink-0 font-mono text-[0.7rem] text-muted-foreground">
                      {member.registration}
                    </span>
                  </li>
                ))}
                {group.members.length === 0 && (
                  <li className="text-muted-foreground">Sem aventureiros</li>
                )}
              </ul>

              <ul className="mt-auto space-y-1 border-t border-border/60 pt-3 text-xs">
                {agenda.incursions.map((incursion) => {
                  const participation = incursion.participations.find(
                    (item) => item.group_id === group.id,
                  );
                  return (
                    <li key={incursion.id} className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-muted-foreground">
                        Inc. {incursion.number}
                      </span>
                      <span
                        className={
                          participation ? "font-medium" : "text-muted-foreground"
                        }
                      >
                        {participation ? participation.language : "—"}
                      </span>
                    </li>
                  );
                })}
                {agenda.incursions.length === 0 && (
                  <li className="text-muted-foreground">Sem incursões</li>
                )}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
