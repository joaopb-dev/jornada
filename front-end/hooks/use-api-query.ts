"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type QueryStatus = "loading" | "ready" | "error";

/**
 * Carrega dados da API **em efeito com `.then`** (regra do projeto).
 *
 * O fetcher fica numa referência: a busca roda ao montar e quando `reload`
 * ou `retry` são chamados — nunca em cada render. `refresh()` recarrega em
 * silêncio (após mutações, sem piscar o spinner); `retry()` mostra o
 * carregamento de novo (estado de erro). A requisição em voo é cancelada
 * ao desmontar (AbortController).
 */
export function useApiQuery<T>(fetcher: (signal: AbortSignal) => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<QueryStatus>("loading");
  const [attempt, setAttempt] = useState(0);
  const fetcherRef = useRef(fetcher);

  // Mantém a referência atualizada sem rebusca (o fetcher costuma ser
  // inline); roda antes do efeito de busca, então o mount já o usa certo.
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    fetcherRef.current(controller.signal).then(
      (value) => {
        if (active) {
          setData(value);
          setStatus("ready");
        }
      },
      () => {
        if (active) setStatus("error");
      },
    );
    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt]);

  /** Recarrega sem mudar o estado visível (pós-mutação). */
  const refresh = useCallback(() => setAttempt((n) => n + 1), []);
  /** Recarrega exibindo o carregamento (retry do erro). */
  const retry = useCallback(() => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  }, []);

  return { data, status, refresh, retry } as const;
}
