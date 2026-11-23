"use client";

import { PageState } from "@/features/journey/components/ui";
import { CalendarDays } from "@/components/icons/rpg-icons";
import { useAgenda } from "../hooks/use-agenda";
import { useLeaderboard } from "../hooks/use-leaderboard";
import { AgendaEvents } from "./agenda-events";
import { AgendaStats } from "./agenda-stats";
import { Podium } from "./podium";
import { SemesterSelect } from "./semester-select";

/**
 * Agenda pública (M-55): painel de areia com **pódio das 3 primeiras
 * equipes** (escudos + tubos de areia na cor do brasão), anúncio das
 * **incursões** e **tabela completa de estatísticas**. Duas leituras
 * públicas: `GET /api/agenda/` + `GET /api/leaderboard/`.
 */
export function PublicAgenda({ embedded = false }: { embedded?: boolean }) {
  const agendaQuery = useAgenda();
  const boardQuery = useLeaderboard();

  const status =
    agendaQuery.status === "error" || boardQuery.status === "error"
      ? "error"
      : agendaQuery.status === "loading" || boardQuery.status === "loading"
        ? "loading"
        : "ready";
  const retry = () => {
    agendaQuery.retry();
    boardQuery.retry();
  };
  const agenda = agendaQuery.agenda;
  const board = boardQuery.entries;

  if (status !== "ready" || !agenda) {
    return <PageState status={status} retry={retry}>{null}</PageState>;
  }

  return (
    <section
      id="agenda"
      className={
        embedded
          ? "w-full py-4"
          : "mx-auto w-full max-w-7xl px-5 py-10 md:px-10 md:py-12"
      }
    >
      <div className="sand-panel rounded-2xl p-5 sm:p-7 md:p-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sand-deep">
              <CalendarDays className="h-4 w-4" aria-hidden />
              Guia das incursões
            </p>
            <h1 className="mt-1 font-display text-3xl text-sand-ink md:text-4xl">
              Agenda de incursões
            </h1>
            <p className="mt-2 max-w-xl font-reading text-sm text-sand-ink-soft">
              Pontos das equipes, próximos eventos e desempenho completo — tudo em um só lugar.
            </p>
          </div>
          <SemesterSelect />
        </header>

        <Podium entries={board} />
        <AgendaEvents agenda={agenda} />
        <AgendaStats entries={board} agenda={agenda} />
      </div>
    </section>
  );
}
