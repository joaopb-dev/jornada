import { MOCKING_MODE } from "@/lib/api-config";
import { createAuthenticationHandlers } from "./authentication";
import { agendaHandlers } from "./agenda";
import { arenaHandlers } from "./arena";

/**
 * Handlers da demo `enabled` (sem backend): auth, agenda e arena.
 *
 * O catálogo **não é mais mockado**: as telas de professor (Aventureiros,
 * Grupos, Perguntas, Habilidades, Chefes, Heróis, Missões, Salão) falam
 * direto com o Django (ADR-024). No modo `disabled` (padrão) não há
 * handler nenhum.
 */
export const handlers =
  MOCKING_MODE === "enabled"
    ? [...createAuthenticationHandlers(), ...agendaHandlers, ...arenaHandlers]
    : [];
