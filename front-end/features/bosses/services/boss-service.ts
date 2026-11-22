import { api } from "@/lib/api";
import { bossSchema, type Boss, type BossWrite } from "../schemas/boss";

const endpoint = "/bosses/";

/** `GET /api/bosses/` — leitura pública do bestiário (com habilidades). */
export async function getBosses(signal?: AbortSignal): Promise<Boss[]> {
  const { data } = await api.get(endpoint, { signal });
  return bossSchema.array().parse(data);
}

/** `POST /api/bosses/` — cria com as habilidades aninhadas. */
export async function createBoss(payload: BossWrite): Promise<Boss> {
  const { data } = await api.post(endpoint, payload);
  return bossSchema.parse(data);
}

/** `PATCH /api/bosses/{id}/` — `abilities` substitui as do chefe. */
export async function updateBoss(id: number, payload: Partial<BossWrite> & { is_active?: boolean }): Promise<Boss> {
  const { data } = await api.patch(`${endpoint}${id}/`, payload);
  return bossSchema.parse(data);
}

/** `DELETE /api/bosses/{id}/` */
export async function deleteBoss(id: number): Promise<void> {
  await api.delete(`${endpoint}${id}/`);
}

export const bossService = {
  list: getBosses,
  create: createBoss,
  update: updateBoss,
  remove: deleteBoss,
};
