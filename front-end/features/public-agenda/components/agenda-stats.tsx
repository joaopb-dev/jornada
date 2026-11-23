"use client";

import type { CSSProperties } from "react";
import { Crest, colorOf, crestFromApi } from "@/features/crest";
import { Gem } from "@/components/icons/rpg-icons";
import { cn } from "@/lib/utils";
import type { Agenda } from "../schemas/agenda";
import type { LeaderboardEntry } from "../schemas/leaderboard";
import { SectionTitle } from "./section-title";

/**
 * Tabela completa de estatísticas (abaixo do pódio): pontos de batalha
 * e extras, total com **barra horizontal na cor do escudo**, aventureiros
 * e desempenho nas incursões (participações + linguagens apresentadas).
 * Só usa dados públicos do leaderboard + da agenda (M-55).
 */

const RANK_MEDAL: Partial<Record<number, string>> = {
  1: "bg-guild-gold text-guild-stone",
  2: "bg-[#a8adb3] text-[#2e3236]",
  3: "bg-[#b0764a] text-[#3a2415]",
};

export function AgendaStats({
  entries,
  agenda,
}: {
  entries: LeaderboardEntry[];
  agenda: Agenda;
}) {
  const maxPoints = Math.max(0, ...entries.map((entry) => entry.total_points));

  // Desempenho por equipe nas incursões: nº de participações e
  // linguagens apresentadas (chave = id do grupo, igual ao leaderboard).
  const performance = new Map<number, { count: number; languages: Set<string> }>();
  for (const incursion of agenda.incursions) {
    for (const participation of incursion.participations) {
      const stats =
        performance.get(participation.group_id) ?? { count: 0, languages: new Set<string>() };
      stats.count += 1;
      stats.languages.add(participation.language);
      performance.set(participation.group_id, stats);
    }
  }

  return (
    <div className="mt-10">
      <SectionTitle
        icon={Gem}
        title="Estatísticas das equipes"
        subtitle="Desempenho completo: pontos, aventureiros e incursões participadas."
      />
      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-sand-line px-4 py-8 text-center font-reading text-sm text-sand-ink-soft">
          Nenhuma equipe no placar ainda.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="sand-table w-full min-w-[860px]">
            <thead>
              <tr>
                <th className="w-14 text-center">Pos.</th>
                <th>Equipe</th>
                <th className="text-center">Aventureiros</th>
                <th className="text-center">Batalhas</th>
                <th className="text-center">Extras</th>
                <th className="min-w-[240px]">Total de pontos</th>
                <th className="text-center">Incursões</th>
                <th>Linguagens</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const spec = crestFromApi(entry);
                const sand = colorOf(spec.color).fill;
                const stats = performance.get(entry.id);
                const languages = [...(stats?.languages ?? [])].sort();
                const percent = maxPoints > 0 ? (entry.total_points / maxPoints) * 100 : 0;

                return (
                  <tr key={entry.id}>
                    <td className="text-center">
                      <span
                        className={cn(
                          "inline-flex h-7 w-7 items-center justify-center rounded-full font-display text-xs font-bold",
                          RANK_MEDAL[entry.position] ??
                            "border border-sand-line bg-white/50 text-sand-ink-soft",
                        )}
                      >
                        {entry.position}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Crest spec={spec} size={26} className="shrink-0" />
                        <span className="font-display text-[0.95rem] text-sand-ink">
                          {entry.name}
                        </span>
                      </div>
                    </td>
                    <td className="text-center">{entry.member_count}</td>
                    <td className="text-center">{entry.points}</td>
                    <td className="text-center">{entry.extra_points}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="w-9 shrink-0 text-right font-display text-sm font-bold text-sand-ink">
                          {entry.total_points}
                        </span>
                        <span
                          className="sand-bar"
                          style={{ "--sand": sand } as CSSProperties}
                          role="img"
                          aria-label={`${entry.total_points} pontos`}
                        >
                          <span className="sand-bar__fill" style={{ width: `${percent}%` }} />
                        </span>
                      </div>
                    </td>
                    <td className="text-center">{stats?.count ?? 0}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {languages.length > 0 ? (
                          languages.map((language) => (
                            <span
                              key={language}
                              className="rounded-full border border-sand-line bg-white/60 px-2 py-0.5 text-[0.65rem] text-sand-ink-soft"
                            >
                              {language}
                            </span>
                          ))
                        ) : (
                          <span className="text-sand-ink-soft">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
