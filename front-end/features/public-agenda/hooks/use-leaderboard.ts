"use client";

import { useEffect, useState } from "react";
import { getLeaderboard } from "../services/leaderboard-service";
import type { LeaderboardEntry } from "../schemas/leaderboard";

/** Lê o placar público (`GET /api/leaderboard/`) com estado de carga/erro. */
export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getLeaderboard().then(
      (data) => {
        if (active) {
          setEntries(data);
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
    entries,
    status,
    retry: () => {
      setStatus("loading");
      setAttempt((value) => value + 1);
    },
  };
}
