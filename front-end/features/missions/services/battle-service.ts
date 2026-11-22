import { api } from "@/lib/api";
import {
  answerResultSchema,
  battleStateSchema,
  groupJourneySchema,
  journeySummarySchema,
  stageProgressSchema,
  type AnswerResult,
  type BattleState,
  type GroupJourney,
  type JourneySummary,
  type StageProgress,
} from "../schemas/mission";

/** `GET /api/group-journeys/` — todas as corridas (ou `?journey=` de uma). */
export async function getGroupJourneys(journeyId?: number, signal?: AbortSignal): Promise<GroupJourney[]> {
  const { data } = await api.get("/group-journeys/", { params: journeyId ? { journey: journeyId } : undefined, signal });
  return groupJourneySchema.array().parse(data);
}

/** `POST /api/group-journeys/` — inscreve um grupo na jornada. */
export async function createGroupJourney(payload: { group: number; journey: number }): Promise<GroupJourney> {
  const { data } = await api.post("/group-journeys/", payload);
  return groupJourneySchema.parse(data);
}

/** `GET /api/stage-progress/` — progressos (para achar a batalha aberta). */
export async function getStageProgress(signal?: AbortSignal): Promise<StageProgress[]> {
  const { data } = await api.get("/stage-progress/", { signal });
  return stageProgressSchema.array().parse(data);
}

/** `POST /api/battle/start/` — abre a próxima etapa (regras no servidor). */
export async function startBattle(groupJourney: number, stage?: number): Promise<BattleState> {
  const { data } = await api.post("/battle/start/", { group_journey: groupJourney, ...(stage ? { stage } : {}) });
  return battleStateSchema.parse(data);
}

/** `GET /api/battle/{id}/` — estado atual (leitura pública: placar ao vivo). */
export async function getBattle(progressId: number, signal?: AbortSignal): Promise<BattleState> {
  const { data } = await api.get(`/battle/${progressId}/`, { signal });
  return battleStateSchema.parse(data);
}

/** `POST /api/battle/{id}/answer/` — responde a pergunta pendente. */
export async function answerBattle(
  progressId: number,
  payload: { choice: number; student?: number | null; spell?: number | null },
): Promise<AnswerResult> {
  const { data } = await api.post(`/battle/${progressId}/answer/`, payload);
  return answerResultSchema.parse(data);
}

/** `GET /api/group-journeys/{id}/summary/` — nota sugerida e por aluno. */
export async function getJourneySummary(groupJourneyId: number): Promise<JourneySummary> {
  const { data } = await api.get(`/group-journeys/${groupJourneyId}/summary/`);
  return journeySummarySchema.parse(data);
}

export const battleService = {
  runs: getGroupJourneys,
  createRun: createGroupJourney,
  progress: getStageProgress,
  start: startBattle,
  state: getBattle,
  answer: answerBattle,
  summary: getJourneySummary,
};
