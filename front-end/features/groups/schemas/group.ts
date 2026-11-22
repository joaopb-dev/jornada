import { z } from "zod";

/**
 * DTO de `/api/groups/` — espelha o `GroupSerializer` (ADR-024).
 *
 * Membros **não** vêm no corpo: ficam em `students[].group` (o endpoint
 * `set-members/` é quem grava). `extra_points` é um inteiro do time.
 */
export const groupSchema = z.object({
  id: z.coerce.number().int(),
  name: z.string().trim().min(1).max(100),
  letter: z.string().nullable(),
  points: z.number().int(),
  extra_points: z.number().int(),
  total_points: z.number().int(),
  member_count: z.number().int(),
  is_active: z.boolean(),
  crest_shape: z.string(),
  crest_color: z.string(),
  crest_symbol: z.string(),
});

export type Group = z.infer<typeof groupSchema>;

/** O que o form edita — os membros vão pelo `set-members`. */
export interface GroupWrite {
  name: string;
  letter: string | null;
  extra_points: number;
  crest_shape: string;
  crest_color: string;
  crest_symbol: string;
}
