import { MOCKING_MODE } from "@/lib/api-config";
import { createAuthenticationHandlers } from "./authentication";
import { agendaHandlers } from "./agenda";
import { catalogHandlers } from "./catalog";
import { arenaHandlers } from "./arena";

/**
 * Handlers ativos por modo:
 * - `enabled`  → demo completa (tudo mockado).
 * - `catalog`  → modo híbrido: só o catálogo é mockado; **auth, arena e
 *   agenda são reais** (Django em :8000) — `/agenda/` passa direto.
 */
export const handlers =
  MOCKING_MODE === "catalog"
    ? [...catalogHandlers]
    : [...createAuthenticationHandlers(), ...agendaHandlers, ...catalogHandlers, ...arenaHandlers];
