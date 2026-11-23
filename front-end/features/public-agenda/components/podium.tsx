"use client";

import type { CSSProperties } from "react";
import { Crest, colorOf, crestFromApi } from "@/features/crest";
import { Flag } from "@/components/icons/rpg-icons";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "../schemas/leaderboard";
import { SectionTitle } from "./section-title";

/**
 * Pódio das 3 primeiras equipes: escudos em ordem de tamanho (1º no
 * meio, 2º à esquerda, 3º à direita) e um tubo de vidro **em cima de
 * cada escudo**, com areia na cor do brasão preenchendo conforme os
 * pontos — alusão aos relógios de areia da casa (M-55).
 */

const RANK_STYLE: Record<
  1 | 2 | 3,
  { label: string; tube: CSSProperties; crest: number; points: string; name: string; plate: string }
> = {
  1: {
    label: "1º lugar",
    tube: {
      "--tube-h": "clamp(190px, 26vw, 250px)",
      "--tube-w": "clamp(54px, 7vw, 68px)",
    } as CSSProperties,
    crest: 118,
    points: "text-4xl",
    name: "text-xl",
    plate: "bg-guild-gold text-guild-stone",
  },
  2: {
    label: "2º lugar",
    tube: {
      "--tube-h": "clamp(150px, 20vw, 196px)",
      "--tube-w": "clamp(46px, 6vw, 58px)",
    } as CSSProperties,
    crest: 94,
    points: "text-3xl",
    name: "text-lg",
    plate: "bg-[#a8adb3] text-[#2e3236]",
  },
  3: {
    label: "3º lugar",
    tube: {
      "--tube-h": "clamp(126px, 17vw, 164px)",
      "--tube-w": "clamp(42px, 5.5vw, 52px)",
    } as CSSProperties,
    crest: 82,
    points: "text-2xl",
    name: "text-base",
    plate: "bg-[#b0764a] text-[#3a2415]",
  },
};

/** Tubo de vidro com areia da cor do escudo (`--sand`) até `--fill` %. */
function SandTube({ fill, sand, tube, label }: { fill: number; sand: string; tube: CSSProperties; label: string }) {
  return (
    <div
      className="sand-tube"
      style={{ ...tube, "--fill": `${fill}%`, "--sand": sand } as CSSProperties}
      role="img"
      aria-label={label}
    >
      <div className="sand-tube__fill" />
      <span className="sand-tube__shine" aria-hidden />
    </div>
  );
}

function Spot({
  entry,
  rank,
  maxPoints,
}: {
  entry: LeaderboardEntry;
  rank: 1 | 2 | 3;
  maxPoints: number;
}) {
  const style = RANK_STYLE[rank];
  const spec = crestFromApi(entry);
  const sand = colorOf(spec.color).fill;
  const fill = maxPoints > 0 ? (entry.total_points / maxPoints) * 100 : 0;
  const members = entry.member_count;

  return (
    <div className="flex flex-col items-center text-center">
      <p className={cn("font-display font-bold leading-none text-sand-ink", style.points)}>
        {entry.total_points}
      </p>
      <p className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-sand-ink-soft">
        pontos
      </p>

      <div className="mt-2">
        <SandTube
          fill={fill}
          sand={sand}
          tube={style.tube}
          label={`Areia de ${entry.name}: ${Math.round(fill)}% do tubo (${entry.total_points} pontos)`}
        />
      </div>

      <div className="relative -mt-2">
        <Crest spec={spec} size={style.crest} className="drop-shadow-md" />
      </div>

      <span
        className={cn(
          "mt-3 rounded-full px-3 py-0.5 font-display text-xs font-bold uppercase tracking-wider",
          style.plate,
        )}
      >
        {style.label}
      </span>

      <p className={cn("mt-2 font-display text-sand-ink", style.name)}>{entry.name}</p>
      <p className="text-xs text-sand-ink-soft">
        {members} {members === 1 ? "aventureiro" : "aventureiros"}
      </p>
    </div>
  );
}

export function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const byRank = (position: number) => entries.find((entry) => entry.position === position);
  // Ordem do pódio: 2º à esquerda, 1º no meio (maior), 3º à direita.
  const order = [byRank(2), byRank(1), byRank(3)].filter(
    (entry): entry is LeaderboardEntry => Boolean(entry),
  );
  const maxPoints = Math.max(0, ...entries.map((entry) => entry.total_points));

  return (
    <div className="mt-8">
      <SectionTitle
        icon={Flag}
        title="Placar das equipes"
        subtitle="A areia de cada tubo acompanha os pontos: quanto mais pontos, mais cheio o tubo."
      />
      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-sand-line px-4 py-8 text-center font-reading text-sm text-sand-ink-soft">
          Nenhuma equipe no placar ainda.
        </p>
      ) : (
        <ol className="flex flex-wrap items-end justify-center gap-x-6 gap-y-10 md:gap-x-14">
          {order.map((entry) => (
            <li key={entry.id}>
              <Spot entry={entry} rank={entry.position as 1 | 2 | 3} maxPoints={maxPoints} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
