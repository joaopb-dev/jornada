import { http, HttpResponse } from "msw";
import { API_BASE_URL } from "@/lib/api-config";
import {
  agendaWriteSchema,
  type Agenda,
  type AgendaWrite,
} from "@/features/public-agenda/schemas/agenda";
import { agendaSeed } from "../landing-agenda";
import { isMockTeacher } from "../mock-teacher";

/**
 * Espelho de `GET/PUT /api/agenda/` para a demo completa (`enabled`) e
 * para os testes — no modo `catalog` os handlers ficam de fora e a
 * agenda bate no Django de verdade (ADR-023).
 */
let state: Agenda = structuredClone(agendaSeed);
let sequence = 100;

/** Restaura a semente (isolamento entre testes). */
export function resetAgenda(): void {
  state = structuredClone(agendaSeed);
  sequence = 100;
}

const errorList = (messages: string[]) => HttpResponse.json(messages, { status: 400 });

/** Regras de negócio como **lista** — mesmo formato do backend. */
function ruleErrors(payload: AgendaWrite): string[] {
  const errors: string[] = [];
  const numbers = payload.incursions.map((incursion) => incursion.number);
  if (new Set(numbers).size !== numbers.length) {
    errors.push("Número de incursão repetido.");
  }
  const active = new Set(state.groups.map((group) => group.id));
  for (const incursion of payload.incursions) {
    if (!incursion.title.trim()) {
      errors.push(`Título da incursão ${incursion.number} é obrigatório.`);
    }
    const seen = new Set<number>();
    for (const part of incursion.participations) {
      if (!active.has(part.group_id)) {
        errors.push(`Equipe ${part.group_id} inexistente ou inativa.`);
      } else if (seen.has(part.group_id)) {
        errors.push("Equipe repetida na mesma incursão.");
      }
      seen.add(part.group_id);
    }
  }
  return errors;
}

export const agendaHandlers = [
  http.get(`${API_BASE_URL}/agenda/`, () => HttpResponse.json(state)),
  http.put(`${API_BASE_URL}/agenda/`, async ({ request }) => {
    if (!isMockTeacher(request)) {
      return HttpResponse.json({ detail: "Acesso não autorizado." }, { status: 403 });
    }
    const body = await request.json().catch(() => null);
    const parsed = agendaWriteSchema.safeParse(body);
    if (!parsed.success) {
      return errorList(parsed.error.issues.map((issue) => issue.message));
    }
    const errors = ruleErrors(parsed.data);
    if (errors.length) return errorList(errors);
    // Substituição total (como o backend): ids novos a cada gravação.
    state = {
      groups: state.groups,
      incursions: parsed.data.incursions.map((incursion) => ({
        id: sequence++,
        number: incursion.number,
        title: incursion.title.trim(),
        date: incursion.date,
        participations: incursion.participations.map((part) => ({
          group_id: part.group_id,
          language: part.language.trim(),
        })),
      })),
    };
    return HttpResponse.json(state);
  }),
];
