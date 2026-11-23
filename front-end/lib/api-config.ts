/**
 * Base da API.
 *
 * - Browser: `/api` (same-origin). O proxy do `next.config.ts` encaminha para
 *   o Django em loopback — nenhuma credencial trafega em texto claro e o
 *   browser só fala HTTPS com o próprio Next.
 * - Node (testes/build): URL absoluta no loopback, pois `fetch` relativo não
 *   resolve sem uma origem.
 *
 * Override opcional: `NEXT_PUBLIC_API_BASE_URL` — use apenas se a API rodar
 * em OUTRO domínio (aí o Django precisa aceitar a origem em
 * `CORS_ALLOWED_ORIGINS`).
 */
const explicitBase = process.env.NEXT_PUBLIC_API_BASE_URL;
const fallbackBase = typeof window === "undefined" ? "http://127.0.0.1:8000/api" : "/api";

export const API_BASE_URL = (explicitBase || fallbackBase).replace(/\/+$/, "");

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
