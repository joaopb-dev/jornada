import { z } from "zod";
import { CREST_COLOR_IDS, CREST_SHAPE_IDS, CREST_SYMBOL_IDS } from "../lib/crest";

/**
 * Brasão parametrizado (ADR-016) — contrato zod do catálogo do front.
 * Campos opcionais nos objetos de equipe: dado antigo sem brasão ainda
 * parseia e o `crestOf` completa o padrão na renderização.
 */
export const crestSchema = z.object({
  shape: z.enum(CREST_SHAPE_IDS),
  color: z.enum(CREST_COLOR_IDS),
  symbol: z.enum(CREST_SYMBOL_IDS),
});

/** Versão ausente/velha: aceita e ignora (o `crestOf` decide o padrão). */
export const crestSchemaOptional = crestSchema.optional();
