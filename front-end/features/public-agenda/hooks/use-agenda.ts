"use client";

import { useEffect, useState } from "react";
import { getAgenda } from "../services/agenda-service";
import type { Agenda } from "../schemas/agenda";

/** Lê a agenda pública (`GET /api/agenda/`) com estado de carga/erro. */
export function useAgenda() {
  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getAgenda().then(
      (data) => {
        if (active) {
          setAgenda(data);
          setStatus("ready");
        }
      },
      () => {
        if (active) setStatus("error");
      },
    );
    return () => {
      active = false;
    };
  }, [attempt]);

  return {
    agenda,
    status,
    retry: () => {
      setStatus("loading");
      setAttempt((value) => value + 1);
    },
  };
}
