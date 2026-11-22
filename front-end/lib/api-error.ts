import axios from "axios";

/**
 * Mensagem legível de um erro da API: o `detail` do DRF (string, ou a lista
 * do campo como `{"abilities": ["…"]}`) quando existe; senão a mensagem do
 * próprio erro (rede/timeout); por fim o fallback do chamador.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === "object") {
      const detail = (data as { detail?: unknown }).detail;
      if (typeof detail === "string" && detail) return detail;
      for (const value of Object.values(data)) {
        if (typeof value === "string" && value) return value;
        if (Array.isArray(value) && typeof value[0] === "string") return value[0];
      }
      return fallback; // respondeu, mas sem mensagem aproveitável
    }
    if (error.message) return error.message; // sem resposta: rede/timeout
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/**
 * **Lista** de mensagens de um erro da API — o formato dos erros de regra
 * do DRF (`["…", "…"]`) e também os detalhes por campo
 * (`{"incursions": [{"title": ["…"]}]}`), achatados para exibição.
 */
export function apiErrorList(error: unknown, fallback: string): string[] {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (Array.isArray(data)) {
      const list = data.filter((item): item is string => typeof item === "string" && Boolean(item));
      if (list.length) return list;
    }
    if (data && typeof data === "object") {
      const found: string[] = [];
      const walk = (value: unknown): void => {
        if (typeof value === "string" && value) found.push(value);
        else if (Array.isArray(value)) value.forEach(walk);
        else if (value && typeof value === "object") Object.values(value).forEach(walk);
      };
      walk(data);
      if (found.length) return found;
    }
    if (error.message) return [error.message];
  }
  if (error instanceof Error && error.message) return [error.message];
  return [fallback];
}
