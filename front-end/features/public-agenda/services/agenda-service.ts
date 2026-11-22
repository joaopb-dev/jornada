import { api } from "@/lib/api";
import {
  agendaSchema,
  type Agenda,
  type AgendaWrite,
} from "../schemas/agenda";

/** `GET/PUT /api/agenda/` — contrato real do backend (ADR-023). */
const endpoint = "/agenda/";

export async function getAgenda(signal?: AbortSignal): Promise<Agenda> {
  const { data } = await api.get(endpoint, { signal });
  return agendaSchema.parse(data);
}

/**
 * Substitui as incursões da agenda em uma tacada (o backend devolve a
 * agenda completa de volta). As regras de negócio ficam **no servidor** —
 * os erros chegam como lista DRF e são exibidos como estão.
 */
export async function saveAgenda(payload: AgendaWrite): Promise<Agenda> {
  const { data } = await api.put(endpoint, payload);
  return agendaSchema.parse(data);
}
