export interface Session { role: "professor"; name: string; username: string }

/**
 * Estado global do app: **apenas a sessão**. Todo o dado de catálogo e de
 * jogo vive no backend (ADR-024) — cada tela busca via services/hooks, sem
 * espelho em memória nem `localStorage`.
 */
export interface State {
  session: Session | null;
  setSession: (s: Session | null) => void;
}
