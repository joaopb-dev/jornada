import type { CrestSpec } from "@/features/crest";

export interface Team {
  id: string;
  name: string;
  letter?: string;
  memberIds: string[];
  /** Pontos extras individuais por aluno */
  extraPoints: Record<string, number>;
  /** Brasão da equipe (Fase F) — ausente = padrão do gerador. */
  crest?: CrestSpec;
}
