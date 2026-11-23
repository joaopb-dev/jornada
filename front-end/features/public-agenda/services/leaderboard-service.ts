import { api } from "@/lib/api";
import {
  leaderboardSchema,
  type LeaderboardEntry,
} from "../schemas/leaderboard";

/**
 * `GET /api/leaderboard/` — placar público (pontos totais desc,
 * empate por nome; só equipes ativas). Alimenta o pódio e a tabela
 * de estatísticas da agenda.
 */
export async function getLeaderboard(
  signal?: AbortSignal,
): Promise<LeaderboardEntry[]> {
  const { data } = await api.get("/leaderboard/", { signal });
  return leaderboardSchema.parse(data);
}
