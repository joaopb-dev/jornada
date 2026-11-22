import { z } from "zod";

const attribute = z.number().int().min(0).max(5);

/** Atributos da ficha: {forca, sabedoria, carisma} em 0..5. */
export const heroAttributesSchema = z.object({
  forca: attribute,
  sabedoria: attribute,
  carisma: attribute,
});

/**
 * DTO de `/api/heroes/` — espelha o `HeroSerializer` (ADR-024):
 * `hero_class`/`role`/`image`/`description`/`passive`/`attributes` e
 * `spells` (PKs); `group`/`journey` **null** = modelo avulso do
 * catálogo (com par, é o representante da equipe na batalha).
 */
export const heroSchema = z.object({
  id: z.coerce.number().int(),
  name: z.string().trim().min(1).max(100),
  /** Arte em `/personagens/` servida pelo Next (`Hero.image`). */
  image: z.string(),
  group: z.number().int().nullable(),
  group_name: z.string().nullable(),
  journey: z.number().int().nullable(),
  journey_name: z.string().nullable(),
  hero_class: z.string(),
  role: z.enum(["Ataque", "Suporte"]),
  description: z.string(),
  passive: z.string(),
  // Linhas antigas podem ter vindo do ORM sem a ficha completa →0..0.
  attributes: z.preprocess((value) => {
    const raw = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
    return { forca: raw.forca ?? 0, sabedoria: raw.sabedoria ?? 0, carisma: raw.carisma ?? 0 };
  }, heroAttributesSchema),
  spells: z.array(z.coerce.number().int()),
  is_active: z.boolean(),
});

export type Hero = z.infer<typeof heroSchema>;
export type HeroAttributes = z.infer<typeof heroAttributesSchema>;

/** O que o form edita. `group`/`journey` vão explícitos (null no create). */
export interface HeroWrite {
  name: string;
  /** Caminho local (`/…`) ou URL HTTPS; vazio = sem arte. */
  image: string;
  hero_class: string;
  role: "Ataque" | "Suporte";
  description: string;
  passive: string;
  attributes: HeroAttributes;
  spells: number[];
  group: number | null;
  journey: number | null;
  /** Só no toggle do card (create usa o default do servidor). */
  is_active?: boolean;
}
