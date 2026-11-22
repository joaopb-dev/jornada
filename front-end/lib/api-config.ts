export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api").replace(/\/+$/, "");

/**
 * Modo de mocking (dev):
 * - `enabled`  → demo completa sem backend: MSW cuida de auth, agenda e arena.
 * - `disabled` → sem MSW: tudo real (Django). É o padrão do `.env` — todas
 *   as telas de professor falam com a API real (ADR-024).
 * Produção nunca mocka (`NODE_ENV === "development"`).
 */
export type MockingMode = "enabled" | "disabled";

const rawMode = process.env.NEXT_PUBLIC_API_MOCKING;

export const MOCKING_MODE: MockingMode = rawMode === "enabled" ? "enabled" : "disabled";

/** Demo completa (tudo mockado). */
export const MOCKING_ENABLED = process.env.NODE_ENV === "development" && MOCKING_MODE === "enabled";

/** MSW ativo (somente a demo `enabled`). */
export const MSW_ACTIVE = process.env.NODE_ENV === "development" && MOCKING_MODE === "enabled";
