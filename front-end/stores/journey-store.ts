import type { State } from "@/stores/journey-store.types";
import { create } from "zustand";
import { tokenStorage } from "@/lib/token-storage";

/**
 * Store da sessão do professor (login/perfil/shell). Nada de catálogo ou
 * incursões mora aqui: a fonte de verdade de tudo é o backend (ADR-024).
 */
export const useJornada = create<State>((set) => ({
  session: null,
  setSession: (session) => {
    if (!session) tokenStorage.clear();
    if (typeof window !== "undefined") {
      if (session) sessionStorage.setItem("jornada-session", JSON.stringify(session));
      else sessionStorage.removeItem("jornada-session");
    }
    set({ session });
  },
}));

export function restoreSession() {
  if (typeof window === "undefined") return;
  if (!tokenStorage.read()) {
    useJornada.getState().setSession(null);
    return;
  }
  const raw = sessionStorage.getItem("jornada-session");
  if (raw) {
    try {
      const session = JSON.parse(raw);
      if (session?.role !== "professor" || typeof session.username !== "string" || typeof session.name !== "string") throw new Error("Invalid session");
      useJornada.setState({ session });
    } catch {
      useJornada.getState().setSession(null);
    }
  }
}
