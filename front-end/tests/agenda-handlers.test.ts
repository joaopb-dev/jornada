import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { setupServer } from "msw/node";
import { agendaHandlers, resetAgenda } from "../mocks/handlers/agenda";
import { API_BASE_URL } from "../lib/api-config";

function storage(): Storage {
  const values = new Map<string, string>();
  return { get length() { return values.size; }, clear: () => values.clear(), getItem: (key) => values.get(key) ?? null, key: (index) => [...values.keys()][index] ?? null, removeItem: (key) => { values.delete(key); }, setItem: (key, value) => { values.set(key, value); } };
}

const server = setupServer(...agendaHandlers);
const url = `${API_BASE_URL}/agenda/`;
const headers = { Authorization: "Bearer teacher-token", "Content-Type": "application/json" };

before(() => {
  Object.defineProperty(globalThis, "localStorage", { value: storage(), configurable: true });
  Object.defineProperty(globalThis, "sessionStorage", { value: storage(), configurable: true });
  sessionStorage.setItem("jornada-mock-tokens", JSON.stringify({ access: ["teacher-token"] }));
  server.listen({ onUnhandledFrame: "error" });
});
beforeEach(() => resetAgenda());
after(() => { server.close(); Reflect.deleteProperty(globalThis, "localStorage"); Reflect.deleteProperty(globalThis, "sessionStorage"); });

test("leitura pública devolve equipes com brasão e incursões com data", async () => {
  const agenda = await (await fetch(url)).json();
  assert.equal(agenda.groups.length, 4);
  assert.equal(agenda.groups[0].name, "Lâmina de Prata");
  assert.equal(agenda.groups[0].crest_shape, "classico");
  assert.equal(agenda.groups[0].members[0].registration, "558001");
  assert.equal(agenda.incursions.length, 3);
  assert.equal(agenda.incursions[0].date, "2026-09-14");
  assert.deepEqual(agenda.incursions[0].participations[0], { group_id: 1, language: "C" });
});

test("gravação sem sessão de professor é negada", async () => {
  const resp = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ incursions: [] }) });
  assert.equal(resp.status, 403);
});

test("professor grava e a leitura reflete a troca", async () => {
  const payload = { incursions: [
    { number: 1, title: "O Despertar dos Paradigmas", date: "2026-09-14", participations: [{ group_id: 1, language: "Python" }] },
    { number: 2, title: "A Travessia Funcional", date: null, participations: [] },
  ] };
  const saved = await fetch(url, { method: "PUT", headers, body: JSON.stringify(payload) });
  assert.equal(saved.status, 200);

  const read = await (await fetch(url)).json();
  assert.equal(read.incursions.length, 2);
  assert.equal(read.incursions[0].participations[0].language, "Python");
  assert.equal(read.incursions[1].date, null);
  assert.equal(typeof read.incursions[0].id, "number");
});

test("regras de negócio voltam como lista e nada é gravado", async () => {
  const payload = { incursions: [
    { number: 1, title: "Repetida", date: null, participations: [
      { group_id: 1, language: "C" },
      { group_id: 999, language: "C" },
    ] },
    { number: 1, title: "Também uma", date: null, participations: [] },
  ] };
  const resp = await fetch(url, { method: "PUT", headers, body: JSON.stringify(payload) });
  assert.equal(resp.status, 400);
  const body = await resp.json();
  assert.ok(Array.isArray(body), "erro de regra deve ser lista");
  const joined = body.join(" ");
  assert.ok(joined.includes("Número de incursão repetido."));
  assert.ok(joined.includes("inexistente ou inativa"));

  const read = await (await fetch(url)).json();
  assert.equal(read.incursions.length, 3, "semente intacta: PUT rejeitado não grava");
});

test("título em branco vira erro na lista", async () => {
  const payload = { incursions: [{ number: 1, title: "   ", date: null, participations: [] }] };
  const resp = await fetch(url, { method: "PUT", headers, body: JSON.stringify(payload) });
  assert.equal(resp.status, 400);
  const body = await resp.json();
  assert.ok(Array.isArray(body));
  assert.ok(body.includes("Título da incursão 1 é obrigatório."));
});

test("placar público devolve as equipes ordenadas com posição", async () => {
  type BoardEntry = { position: number; name: string; points: number; extra_points: number; total_points: number };
  const board: BoardEntry[] = await (await fetch(`${API_BASE_URL}/leaderboard/`)).json();
  assert.equal(board.length, 4);
  assert.deepEqual(board.map((entry) => entry.position), [1, 2, 3, 4]);
  assert.equal(board[0].name, "Chama Errante");
  assert.equal(board[0].total_points, 120);
  assert.equal(board[3].name, "Lâmina de Prata");
  assert.ok(board[0].total_points >= board[3].total_points, "total desc");
  assert.equal(board[0].total_points, board[0].points + board[0].extra_points, "total = batalhas + extras");
});
