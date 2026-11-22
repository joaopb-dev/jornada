import { z } from "zod";

export const imageUrlSchema = z.string().refine((value) => !value || /^\/(?!\/)/.test(value) || /^https:\/\//i.test(value), "Use caminho local ou URL HTTPS.");

/** Habilidade punitiva (espelha `BossAbilitySerializer` — ADR-017/024). */
export const bossAbilitySchema = z.object({
  id: z.coerce.number().int(),
  name: z.string().trim().min(1),
  trigger: z.enum(["TEMPO", "CONCEITO", "FUNDAMENTOS", "DEMONSTRACAO", "SUPORTE", "GERAL", "PERGUNTAS"]),
  effect: z.enum(["PENALTY", "HEAL", "DRAIN", "CUT", "DISADV", "PR_COST"]),
  value: z.number().int(),
  every: z.number().int(),
  threshold: z.number().int(),
  mode: z.enum(["ANY", "AVERAGE", "SPREAD"]),
  scope: z.enum(["TEAM", "ALLIANCE"]),
  min_count: z.number().int(),
  description: z.string(),
});

/**
 * DTO de `/api/bosses/` — espelha o `BossSerializer` (ADR-024): `max_hp`,
 * `is_active` e `abilities` aninhadas graváveis (na escrita a lista
 * substitui as do chefe).
 */
export const bossSchema = z.object({
  id: z.coerce.number().int(),
  name: z.string().trim().min(1).max(100),
  specialty: z.string(),
  description: z.string(),
  image: z.string(),
  max_hp: z.number().int(),
  is_active: z.boolean(),
  spells: z.array(z.coerce.number().int()),
  abilities: z.array(bossAbilitySchema),
});

export type BossTrigger = z.infer<typeof bossAbilitySchema>["trigger"];
export type BossEffect = z.infer<typeof bossAbilitySchema>["effect"];
export type BossMode = z.infer<typeof bossAbilitySchema>["mode"];
export type BossScope = z.infer<typeof bossAbilitySchema>["scope"];
export type BossAbility = z.infer<typeof bossAbilitySchema>;
export type Boss = z.infer<typeof bossSchema>;

/** Habilidade sem id — na escrita a lista substitui as do servidor. */
export type BossAbilityWrite = Omit<BossAbility, "id">;

/** O que o form edita (o servidor guarda `spells`/`is_active` à parte). */
export interface BossWrite {
  name: string;
  max_hp: number;
  specialty: string;
  description: string;
  image: string;
  abilities: BossAbilityWrite[];
}
