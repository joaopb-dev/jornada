import { z } from "zod";

/**
 * Entrada de `GET /api/leaderboard/` — placar público das equipes
 * ativas (sem login). A `position` (1-based) é calculada na view; o
 * resto espelha o `LeaderboardSerializer` (batalhas + extras = total).
 */
export const leaderboardEntrySchema = z.object({
  position: z.number().int().min(1),
  id: z.number().int(),
  name: z.string().trim().min(1),
  points: z.number(),
  extra_points: z.number(),
  total_points: z.number(),
  member_count: z.number().int().min(0),
  crest_shape: z.string(),
  crest_color: z.string(),
  crest_symbol: z.string(),
});

export const leaderboardSchema = z.array(leaderboardEntrySchema);

export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;
