import { z } from "zod";

/** Status de corrida/etapa no back-end (`GroupJourney`/`StageProgress`). */
export const runStatusSchema = z.enum(["PROG", "DONE", "FAIL"]);
export type RunStatus = z.infer<typeof runStatusSchema>;

/** DTO de `/api/journeys/`. */
export const journeySchema = z.object({
  id: z.coerce.number().int(),
  name: z.string().trim().min(1).max(100),
  description: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
});
export type Journey = z.infer<typeof journeySchema>;

/** O que o form de jornada edita. */
export interface JourneyWrite {
  name: string;
  description: string;
  is_active: boolean;
}

/** DTO de `/api/stages/`. */
export const stageSchema = z.object({
  id: z.coerce.number().int(),
  journey: z.coerce.number().int(),
  journey_name: z.string().nullable(),
  order: z.coerce.number().int(),
  name: z.string(),
  description: z.string(),
  max_score: z.coerce.number().int(),
  boss_pool: z.array(z.coerce.number().int()),
  boss_names: z.array(z.string()),
});
export type Stage = z.infer<typeof stageSchema>;

/** O que o form de etapa edita. */
export interface StageWrite {
  journey: number;
  order: number;
  name: string;
  description: string;
  max_score: number;
  boss_pool: number[];
}

/** DTO de `/api/group-journeys/` (a corrida de um grupo na jornada). */
export const groupJourneySchema = z.object({
  id: z.coerce.number().int(),
  group: z.coerce.number().int(),
  group_name: z.string().nullable(),
  journey: z.coerce.number().int(),
  journey_name: z.string().nullable(),
  status: runStatusSchema,
  current_stage: z.coerce.number().int().nullable(),
  started_at: z.string().nullable(),
  finished_at: z.string().nullable(),
  total_score: z.coerce.number().int(),
});
export type GroupJourney = z.infer<typeof groupJourneySchema>;

/** Linha de `/api/stage-progress/` — usada para achar a batalha aberta. */
export const stageProgressSchema = z.object({
  id: z.coerce.number().int(),
  group_journey: z.coerce.number().int(),
  stage: z.coerce.number().int(),
  stage_name: z.string().nullable(),
  status: runStatusSchema,
  score: z.coerce.number().int(),
});
export type StageProgress = z.infer<typeof stageProgressSchema>;

/* ---------- Batalha (o que o servidor devolve a cada rodada) ---------- */

export const battleChoiceSchema = z.object({
  id: z.coerce.number().int(),
  text: z.string(),
});

/** Pergunta pública — o gabarito (`is_correct`) NUNCA sai do servidor. */
export const battleQuestionSchema = z.object({
  id: z.coerce.number().int(),
  text: z.string(),
  points: z.coerce.number().int(),
  choices: z.array(battleChoiceSchema),
});

export const battleSpellSchema = z.object({
  id: z.coerce.number().int(),
  name: z.string(),
  description: z.string(),
  spell_type: z.string(),
  base_value: z.coerce.number().int(),
  cooldown_turns: z.coerce.number().int(),
  ready: z.boolean(),
  cooldown_left: z.coerce.number().int(),
});

export const battleEventSchema = z.object({
  id: z.coerce.number().int(),
  turn: z.coerce.number().int(),
  actor: z.string(),
  student: z.coerce.number().int().nullable(),
  question: z.coerce.number().int().nullable(),
  answered_correctly: z.boolean().nullable(),
  spell: z.coerce.number().int().nullable(),
  spell_name: z.string().nullable(),
  value: z.number().nullable(),
  created_at: z.string(),
});

export const battleStateSchema = z.object({
  id: z.coerce.number().int(),
  status: runStatusSchema,
  turn: z.coerce.number().int(),
  score: z.coerce.number().int(),
  started_at: z.string().nullable(),
  finished_at: z.string().nullable(),
  group_journey: z.object({
    id: z.coerce.number().int(),
    status: runStatusSchema,
    group: z.coerce.number().int(),
    group_name: z.string(),
    journey: z.coerce.number().int(),
  }),
  stage: z.object({
    id: z.coerce.number().int(),
    order: z.coerce.number().int(),
    name: z.string(),
    max_score: z.coerce.number().int(),
  }),
  hero: z.object({
    id: z.coerce.number().int().nullable(),
    name: z.string().nullable(),
    power_bonus: z.coerce.number().int(),
    hp: z.coerce.number().int(),
    max_hp: z.coerce.number().int(),
    shield: z.coerce.number().int(),
  }),
  boss: z.object({
    id: z.coerce.number().int().nullable(),
    name: z.string(),
    hp: z.coerce.number().int(),
    max_hp: z.coerce.number().int(),
    shield: z.coerce.number().int(),
  }),
  question: battleQuestionSchema.nullable(),
  spells: z.array(battleSpellSchema),
  events: z.array(battleEventSchema),
});
export type BattleState = z.infer<typeof battleStateSchema>;

/** Resposta de `POST /battle/{id}/answer/`. */
export const answerResultSchema = z.object({
  correct: z.boolean(),
  finished: z.boolean(),
  victory: z.boolean(),
  state: battleStateSchema,
});
export type AnswerResult = z.infer<typeof answerResultSchema>;

/** `GET /group-journeys/{id}/summary/` — nota sugerida e desempenho. */
export const journeySummarySchema = z.object({
  group_journey: z.coerce.number().int(),
  status: runStatusSchema,
  total_score: z.coerce.number().int(),
  max_score: z.coerce.number().int(),
  suggested_grade: z.coerce.number(),
  stages: z.array(z.object({
    stage: z.coerce.number().int(),
    order: z.coerce.number().int(),
    name: z.string(),
    max_score: z.coerce.number().int(),
    score: z.coerce.number().int().nullable(),
    status: runStatusSchema.nullable(),
  })),
  students: z.array(z.object({
    id: z.coerce.number().int(),
    name: z.string(),
    grade: z.number().nullable(),
    answered: z.coerce.number().int(),
    correct: z.coerce.number().int(),
    points: z.coerce.number().int(),
  })),
});
export type JourneySummary = z.infer<typeof journeySummarySchema>;
