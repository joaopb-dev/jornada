import { api } from "@/lib/api";
import { groupSchema, type Group, type GroupWrite } from "../schemas/group";

const endpoint = "/groups/";

/** `GET /api/groups/` — leitura pública das equipes. */
export async function getGroups(signal?: AbortSignal): Promise<Group[]> {
  const { data } = await api.get(endpoint, { signal });
  return groupSchema.array().parse(data);
}

/** `POST /api/groups/` — cria a equipe (membros entram depois, via `set-members`). */
export async function createGroup(payload: GroupWrite): Promise<Group> {
  const { data } = await api.post(endpoint, payload);
  return groupSchema.parse(data);
}

/** `PATCH /api/groups/{id}/` — altera só o que foi enviado. */
export async function updateGroup(id: number, payload: Partial<GroupWrite> & { is_active?: boolean }): Promise<Group> {
  const { data } = await api.patch(`${endpoint}${id}/`, payload);
  return groupSchema.parse(data);
}

/** `DELETE /api/groups/{id}/` — os aventureiros ficam (o FK é SET_NULL). */
export async function deleteGroup(id: number): Promise<void> {
  await api.delete(`${endpoint}${id}/`);
}

/**
 * `POST /api/groups/{id}/set-members/` — define de uma vez quem são os
 * alunos do grupo `{students: [ids]}`; quem sai do grupo fica sem grupo.
 */
export async function setGroupMembers(id: number, students: number[]): Promise<Group> {
  const { data } = await api.post(`${endpoint}${id}/set-members/`, { students });
  return groupSchema.parse(data);
}

export const groupService = {
  list: getGroups,
  create: createGroup,
  update: updateGroup,
  remove: deleteGroup,
  setMembers: setGroupMembers,
};
