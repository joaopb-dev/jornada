import { api } from "@/lib/api";
import { skillSchema, type Skill, type SkillWrite } from "../schemas/skill";

const endpoint = "/spells/";

/** `GET /api/spells/` — leitura pública do grimório. */
export async function getSkills(signal?: AbortSignal): Promise<Skill[]> {
  const { data } = await api.get(endpoint, { signal });
  return skillSchema.array().parse(data);
}

/** `POST /api/spells/` — cria (custo 2/3/5 e dado XdY validados no servidor). */
export async function createSkill(payload: SkillWrite): Promise<Skill> {
  const { data } = await api.post(endpoint, payload);
  return skillSchema.parse(data);
}

/** `PATCH /api/spells/{id}/` — altera só o que foi enviado. */
export async function updateSkill(id: number, payload: Partial<SkillWrite>): Promise<Skill> {
  const { data } = await api.patch(`${endpoint}${id}/`, payload);
  return skillSchema.parse(data);
}

/** `DELETE /api/spells/{id}/` */
export async function deleteSkill(id: number): Promise<void> {
  await api.delete(`${endpoint}${id}/`);
}

export const skillService = {
  list: getSkills,
  create: createSkill,
  update: updateSkill,
  remove: deleteSkill,
};
