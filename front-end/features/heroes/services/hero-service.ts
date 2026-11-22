import { api } from "@/lib/api";
import { heroSchema, type Hero, type HeroWrite } from "../schemas/hero";

const endpoint = "/heroes/";

/** `GET /api/heroes/` — leitura pública do bestiário de heróis. */
export async function getHeroes(signal?: AbortSignal): Promise<Hero[]> {
  const { data } = await api.get(endpoint, { signal });
  return heroSchema.array().parse(data);
}

/**
 * `POST /api/heroes/` — cria a ficha. `group`/`journey` vão **explícitos**
 * (`null` = modelo avulso do catálogo; sem a chave o servidor exige o campo).
 */
export async function createHero(payload: HeroWrite): Promise<Hero> {
  const { data } = await api.post(endpoint, payload);
  return heroSchema.parse(data);
}

/**
 * `PATCH /api/heroes/{id}/` — altera só o que foi enviado; ligar a uma
 * corrida é `{group, journey}` e devolver ao catálogo é `{group: null,
 * journey: null}`.
 */
export async function updateHero(id: number, payload: Partial<HeroWrite>): Promise<Hero> {
  const { data } = await api.patch(`${endpoint}${id}/`, payload);
  return heroSchema.parse(data);
}

/** `DELETE /api/heroes/{id}/` */
export async function deleteHero(id: number): Promise<void> {
  await api.delete(`${endpoint}${id}/`);
}

export const heroService = {
  list: getHeroes,
  create: createHero,
  update: updateHero,
  remove: deleteHero,
};
