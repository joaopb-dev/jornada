"use client";

import { Crest, crestFromApi } from "@/features/crest";
import { CalendarDays, ScrollText } from "@/components/icons/rpg-icons";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/date-format";
import type { Agenda } from "../schemas/agenda";
import { SectionTitle } from "./section-title";

/**
 * Anúncio das incursões (a agenda em si): cartões com bloco de data,
 * estado do evento (próxima / agendada / realizada) e as equipes
 * inscritas com a linguagem de cada apresentação (M-55).
 */

const MONTH_ABBR = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

type EventState = "next" | "scheduled" | "done" | "tbd";

const STATE_PILL: Record<EventState, string> = {
  next: "bg-guild-green text-guild-ink",
  scheduled: "border border-sand-line bg-white/60 text-sand-ink",
  done: "bg-sand-300/80 text-sand-ink-soft",
  tbd: "border border-dashed border-sand-line text-sand-ink-soft",
};

const STATE_LABEL: Record<EventState, string> = {
  next: "Próxima",
  scheduled: "Agendada",
  done: "Realizada",
  tbd: "Data a definir",
};

/** Data de hoje em ISO local (comparações lexicais seguras). */
function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function AgendaEvents({ agenda }: { agenda: Agenda }) {
  const today = todayIso();
  const upcoming = agenda.incursions
    .filter((incursion) => incursion.date && incursion.date >= today)
    .sort((left, right) => (left.date ?? "").localeCompare(right.date ?? ""))[0];

  const stateOf = (date: string | null): EventState => {
    if (!date) return "tbd";
    if (upcoming && date === upcoming.date && date >= today) return "next";
    return date < today ? "done" : "scheduled";
  };

  return (
    <div className="mt-10">
      <SectionTitle
        icon={ScrollText}
        title="Incursões"
        subtitle="Os eventos da temporada — fique de olho para acompanhar cada apresentação."
      />
      {agenda.incursions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-sand-line px-4 py-8 text-center font-reading text-sm text-sand-ink-soft">
          Nenhuma incursão agendada ainda.
        </p>
      ) : (
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agenda.incursions.map((incursion) => {
            const state = stateOf(incursion.date);
            const [, month, day] = (incursion.date ?? "").split("-");
            const teams = incursion.participations
              .map((participation) => ({
                participation,
                group: agenda.groups.find((group) => group.id === participation.group_id),
              }))
              .filter((item) => Boolean(item.group));

            return (
              <li key={incursion.id} className="sand-card flex flex-col gap-3 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-display text-xs uppercase tracking-[0.18em] text-sand-deep">
                    Incursão {incursion.number}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider",
                      STATE_PILL[state],
                    )}
                  >
                    {STATE_LABEL[state]}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {incursion.date ? (
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-sand-line bg-white/55 shadow-inner">
                      <span className="font-display text-xl leading-none text-sand-ink">{day}</span>
                      <span className="mt-0.5 text-[0.6rem] font-semibold uppercase tracking-widest text-sand-ink-soft">
                        {MONTH_ABBR[Number(month) - 1]}
                      </span>
                    </div>
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-sand-line text-sand-ink-soft">
                      <CalendarDays className="h-5 w-5" aria-hidden />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg leading-tight text-sand-ink">
                      {incursion.title}
                    </p>
                    <time
                      dateTime={incursion.date ?? undefined}
                      className="text-xs text-sand-ink-soft"
                    >
                      {incursion.date ? formatDate(incursion.date) : "Data a definir"}
                    </time>
                  </div>
                </div>

                <ul className="space-y-1.5 border-t border-sand-line/60 pt-3">
                  {teams.map(({ participation, group }) => (
                    <li key={participation.group_id} className="flex items-center gap-2">
                      <Crest spec={crestFromApi(group!)} size={22} className="shrink-0" />
                      <span className="min-w-0 flex-1 truncate text-sm text-sand-ink">
                        {group!.name}
                      </span>
                      <span className="shrink-0 rounded-full border border-sand-line bg-white/60 px-2 py-0.5 text-[0.65rem] text-sand-ink-soft">
                        {participation.language}
                      </span>
                    </li>
                  ))}
                  {teams.length === 0 && (
                    <li className="text-xs text-sand-ink-soft">Nenhuma equipe inscrita.</li>
                  )}
                </ul>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
