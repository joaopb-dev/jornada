import assert from "node:assert/strict";
import { after, afterEach, before, beforeEach, test } from "node:test";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { API_BASE_URL } from "../lib/api-config";
import { bridgeMissingTeams, bridgeTeamCrest } from "../features/crest/services/crest-bridge";

interface Row {
  id: number;
  name: string;
  crest_shape?: string;
  crest_color?: string;
  crest_symbol?: string;
}

let groups: Row[] = [];
let writes: { method: string; path: string; body: unknown }[] = [];
let failGet = false;
let failPost = false;
let nextId = 100;

const server = setupServer(
  http.get(`${API_BASE_URL}/groups/`, () => {
    if (failGet) return HttpResponse.json({ detail: "boom" }, { status: 500 });
    return HttpResponse.json(groups);
  }),
  http.post(`${API_BASE_URL}/groups/`, async ({ request }) => {
    if (failPost) return HttpResponse.json({ detail: "boom" }, { status: 500 });
    const body = (await request.json()) as Partial<Row> & { name: string };
    writes.push({ method: "POST", path: "", body });
    const row: Row = {
      id: nextId++,
      name: body.name,
      crest_shape: body.crest_shape,
      crest_color: body.crest_color,
      crest_symbol: body.crest_symbol,
    };
    groups.push(row);
    return HttpResponse.json(row, { status: 201 });
  }),
  http.patch(`${API_BASE_URL}/groups/:id/`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>;
    writes.push({ method: "PATCH", path: String(params.id), body });
    return HttpResponse.json({ id: Number(params.id), ...body });
  }),
);

before(() => server.listen({ onUnhandledFrame: "error" }));
after(() => server.close());
beforeEach(() => {
  groups = [];
  writes = [];
  failGet = false;
  failPost = false;
});
afterEach(() => server.restoreHandlers());

test("equipe ausente → cria no backend com o brasão escolhido", async () => {
  const result = await bridgeTeamCrest(
    { name: "Nova Equipe", crest: { shape: "losango", color: "roxo", symbol: "corvo" } },
    true,
  );
  assert.equal(result, "created");
  assert.equal(writes.length, 1);
  assert.equal(writes[0]?.method, "POST");
  assert.deepEqual(writes[0]?.body, {
    name: "Nova Equipe",
    crest_shape: "losango",
    crest_color: "roxo",
    crest_symbol: "corvo",
  });
});

test("equipe existente com brasão diferente → PATCH no id dela", async () => {
  groups = [{ id: 7, name: "Lâmina de Prata", crest_shape: "classico", crest_color: "verde", crest_symbol: "espada" }];
  const result = await bridgeTeamCrest(
    { name: "Lâmina de Prata", crest: { shape: "arredondado", color: "dourado", symbol: "corvo" } },
    true,
  );
  assert.equal(result, "updated");
  assert.deepEqual(writes, [{
    method: "PATCH",
    path: "7",
    body: { crest_shape: "arredondado", crest_color: "dourado", crest_symbol: "corvo" },
  }]);
});

test("brasão já idêntico → não grava nada", async () => {
  groups = [{ id: 7, name: "Lâmina de Prata", crest_shape: "classico", crest_color: "verde", crest_symbol: "espada" }];
  const result = await bridgeTeamCrest(
    { name: "Lâmina de Prata", crest: { shape: "classico", color: "verde", symbol: "espada" } },
    true,
  );
  assert.equal(result, "unchanged");
  assert.equal(writes.length, 0);
});

test("sem brasão explícito não sobrescreve o brasão da Arena", async () => {
  groups = [{ id: 7, name: "Lâmina de Prata", crest_shape: "losango", crest_color: "roxo", crest_symbol: "corvo" }];
  // Dado antigo (crest ausente) — ex.: fluxo de atribuir aluno.
  const result = await bridgeTeamCrest({ name: "Lâmina de Prata" }, true);
  assert.equal(result, "unchanged");
  assert.equal(writes.length, 0);
});

test("nome casa mesmo com caixa e espaços diferentes", async () => {
  groups = [{ id: 3, name: "Chama Errante", crest_shape: "arredondado", crest_color: "roxo", crest_symbol: "chama" }];
  const result = await bridgeTeamCrest(
    { name: "  chama errante ", crest: { shape: "arredondado", color: "roxo", symbol: "chama" } },
    true,
  );
  assert.equal(result, "unchanged");
  assert.equal(writes.length, 0);
});

test("carga automática cria só as ausentes e intoca as existentes", async () => {
  groups = [{ id: 7, name: "Lâmina de Prata", crest_shape: "classico", crest_color: "verde", crest_symbol: "espada" }];
  await bridgeMissingTeams([
    { name: "Lâmina de Prata", crest: { shape: "hexagono", color: "preto", symbol: "lua" } },
    { name: "Chama Errante", crest: { shape: "arredondado", color: "roxo", symbol: "chama" } },
  ]);
  assert.equal(writes.length, 1);
  assert.equal(writes[0]?.method, "POST");
  assert.deepEqual(writes[0]?.body, {
    name: "Chama Errante",
    crest_shape: "arredondado",
    crest_color: "roxo",
    crest_symbol: "chama",
  });
});

test("falha no GET → failed sem lançar (e a carga é silenciosa)", async () => {
  failGet = true;
  const result = await bridgeTeamCrest(
    { name: "Qualquer", crest: { shape: "losango", color: "roxo", symbol: "corvo" } },
    true,
  );
  assert.equal(result, "failed");
  await assert.doesNotReject(() => bridgeMissingTeams([{ name: "Qualquer" }]));
  assert.equal(writes.length, 0);
});

test("falha no POST → failed sem lançar", async () => {
  failPost = true;
  const result = await bridgeTeamCrest(
    { name: "Nova Equipe", crest: { shape: "losango", color: "roxo", symbol: "corvo" } },
    true,
  );
  assert.equal(result, "failed");
});
