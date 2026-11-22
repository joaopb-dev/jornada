/**
 * Ponte **Grupos → backend** para o brasão (M-53).
 *
 * A página Grupos vive no catálogo mock (`/mock-catalog/`, localStorage)
 * e a Arena lê `/api/groups/` (Django). Sem esta ponte os brasões criados
 * no gerador ficavam só no navegador e a Arena exibia o padrão
 * (verde com espada) em todas as equipes.
 *
 * Regra: **por nome** (mesma normalização do catálogo — trim +
 * minúsculas pt-BR).
 * - `bridgeTeamCrest(team, true)` — ao salvar no form: cria a equipe no
 *   backend se não existir e **atualiza o brasão** se existir (só com
 *   brasão explícito — dado antigo não sobrescreve gravação da Arena).
 * - `bridgeMissingTeams(teams)` — na carga da página: **só cria** as
 *   equipes ausentes; as já existentes ficam intocadas (o brasão que o
 *   professor gravou pela Arena continua valendo até ele salvar de novo
 *   aqui).
 *
 * Ambas são de **melhor esforço e nunca lançam**: o resultado/segundo
 * plano diz o que houve, sem derrubar a gravação local.
 */
import { api } from "@/lib/api";
import { crestFromApi, crestToApi, type CrestSpec } from "../lib/crest";

interface BridgeTeam {
  name: string;
  crest?: Partial<CrestSpec> | null;
}

interface BackendGroupRow {
  id: number;
  name: string;
  crest_shape?: string;
  crest_color?: string;
  crest_symbol?: string;
}

export type BridgeResult = "created" | "updated" | "unchanged" | "failed";

const normalize = (name: string) => name.trim().toLocaleLowerCase("pt-BR");

async function listBackendGroups(): Promise<BackendGroupRow[]> {
  const { data } = await api.get<BackendGroupRow[]>("/groups/");
  return Array.isArray(data) ? data : [];
}

/**
 * Leva o brasão da equipe ao backend. `overwrite=false` só cria quando a
 * equipe não existe; `overwrite=true` (gravação explícita) cria ou
 * atualiza. Nunca lança — devolve o que aconteceu para o chamador avisar.
 */
export async function bridgeTeamCrest(
  team: BridgeTeam,
  overwrite: boolean,
): Promise<BridgeResult> {
  try {
    const groups = await listBackendGroups();
    const existing = groups.find(
      (group) => normalize(group.name) === normalize(team.name),
    );
    const crest = crestToApi(team.crest);
    if (!existing) {
      await api.post("/groups/", { name: team.name.trim(), ...crest });
      return "created";
    }
    // Sem brasão explícito (dado antigo, fluxo de atribuir aluno) não
    // sobrescreve o que o professor gravou pela Arena.
    if (!overwrite || team.crest == null) return "unchanged";
    const current = crestFromApi(existing);
    if (
      current.shape === crest.crest_shape &&
      current.color === crest.crest_color &&
      current.symbol === crest.crest_symbol
    ) {
      return "unchanged";
    }
    await api.patch(`/groups/${existing.id}/`, crest);
    return "updated";
  } catch {
    return "failed";
  }
}

/**
 * Carga automática (silenciosa): cria no backend, com seus brasões, as
 * equipes do Grupos que ainda não existem. Uma falha não trava as
 * demais e o backend indisponível simplesmente não faz nada.
 */
export async function bridgeMissingTeams(teams: BridgeTeam[]): Promise<void> {
  let groups: BackendGroupRow[];
  try {
    groups = await listBackendGroups();
  } catch {
    return;
  }
  const known = new Set(groups.map((group) => normalize(group.name)));
  for (const team of teams) {
    const key = normalize(team.name);
    if (known.has(key)) continue;
    try {
      await api.post("/groups/", {
        name: team.name.trim(),
        ...crestToApi(team.crest),
      });
      known.add(key);
    } catch {
      // melhor esforço: segue para a próxima equipe
    }
  }
}
