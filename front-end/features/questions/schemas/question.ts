import { z } from "zod";

/** Alternativa aninhada de `/api/questions/` (campo `choices`). */
export const choiceSchema = z.object({
  id: z.coerce.number().int(),
  text: z.string().trim().min(1).max(255),
  is_correct: z.boolean(),
});

export type Choice = z.infer<typeof choiceSchema>;

/**
 * DTO de `/api/questions/` — espelha o `QuestionSerializer` (ADR-024):
 * `text`/`choices[{text,is_correct}]` no vocabulário do servidor; as regras
 * de forma (≥2 alternativas, ≥1 correta) são validadas **na view** e
 * chegam como lista DRF no topo.
 */
export const questionSchema = z.object({
  id: z.coerce.number().int(),
  boss: z.number().int().nullable(),
  boss_name: z.string().nullable(),
  text: z.string().trim().min(1),
  language: z.string(),
  points: z.number().int(),
  choices: z.array(choiceSchema),
});

export type Question = z.infer<typeof questionSchema>;

/** Alternativa sem id — na escrita a lista substitui as do servidor. */
export interface QuestionChoiceWrite {
  text: string;
  is_correct: boolean;
}

/** O que o form edita. `points`/`boss` ficam como estão no servidor. */
export interface QuestionWrite {
  text: string;
  language: string;
  choices: QuestionChoiceWrite[];
}
