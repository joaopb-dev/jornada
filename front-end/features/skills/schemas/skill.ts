import { z } from "zod";

/**
 * `spell_type` de `/api/spells/` — espelha o `Spell.SpellType` do back-end
 * (ADR-024): NONE (suporte), DMGE, HEAL, SHLD. O rótulo em PT é só
 * apresentação (`SKILL_TYPE_LABEL`).
 */
export const skillTypeSchema = z.enum(["NONE", "DMGE", "HEAL", "SHLD"]);

/**
 * DTO de `/api/spells/` — espelha o `SpellSerializer`. Os campos de combate
 * (`base_value`, `max_value`, `cooldown_turns`, `is_active`) vivem no
 * servidor e não são editados pelo form do grimório.
 */
export const skillSchema = z.object({
  id: z.coerce.number().int(),
  name: z.string().trim().min(1).max(100),
  description: z.string(),
  cost: z.number().int(),
  dice: z.string(),
  review: z.boolean(),
  spell_type: skillTypeSchema,
});

export type Skill = z.infer<typeof skillSchema>;
export type SkillType = z.infer<typeof skillTypeSchema>;

/** O que o form edita (custo 2/3/5 e formato do dado são regras do servidor). */
export interface SkillWrite {
  name: string;
  description: string;
  cost: number;
  dice: string;
  review: boolean;
  spell_type: SkillType;
}
