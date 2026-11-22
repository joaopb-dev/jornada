import { api } from "@/lib/api";
import {
  journeySchema,
  stageSchema,
  type Journey,
  type JourneyWrite,
  type Stage,
  type StageWrite,
} from "../schemas/mission";

/* ---------- Jornadas ---------- */

/** `GET /api/journeys/` — campanhas. */
export async function getJourneys(signal?: AbortSignal): Promise<Journey[]> {
  const { data } = await api.get("/journeys/", { signal });
  return journeySchema.array().parse(data);
}

/** `GET /api/journeys/{id}/` — uma jornada. */
export async function getJourney(id: number, signal?: AbortSignal): Promise<Journey> {
  const { data } = await api.get(`/journeys/${id}/`, { signal });
  return journeySchema.parse(data);
}

/** `POST /api/journeys/` */
export async function createJourney(payload: JourneyWrite): Promise<Journey> {
  const { data } = await api.post("/journeys/", payload);
  return journeySchema.parse(data);
}

/** `PATCH /api/journeys/{id}/` */
export async function updateJourney(id: number, payload: Partial<JourneyWrite>): Promise<Journey> {
  const { data } = await api.patch(`/journeys/${id}/`, payload);
  return journeySchema.parse(data);
}

/** `DELETE /api/journeys/{id}/` — apaga etapas e corridas junto (CASCADE). */
export async function deleteJourney(id: number): Promise<void> {
  await api.delete(`/journeys/${id}/`);
}

/* ---------- Etapas ---------- */

/** `GET /api/stages/` (ou `?journey=`) — etapas em ordem de jogo. */
export async function getStages(journeyId?: number, signal?: AbortSignal): Promise<Stage[]> {
  const { data } = await api.get("/stages/", { params: journeyId ? { journey: journeyId } : undefined, signal });
  return stageSchema.array().parse(data);
}

/** `POST /api/stages/` — ordem única dentro da jornada (regra do servidor). */
export async function createStage(payload: StageWrite): Promise<Stage> {
  const { data } = await api.post("/stages/", payload);
  return stageSchema.parse(data);
}

/** `PATCH /api/stages/{id}/` */
export async function updateStage(id: number, payload: Partial<StageWrite>): Promise<Stage> {
  const { data } = await api.patch(`/stages/${id}/`, payload);
  return stageSchema.parse(data);
}

/** `DELETE /api/stages/{id}/` */
export async function deleteStage(id: number): Promise<void> {
  await api.delete(`/stages/${id}/`);
}

export const journeyService = {
  list: getJourneys,
  get: getJourney,
  create: createJourney,
  update: updateJourney,
  remove: deleteJourney,
  stages: getStages,
  createStage,
  updateStage,
  removeStage: deleteStage,
};
