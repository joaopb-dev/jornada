import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { API_BASE_URL } from "../lib/api-config";
import { apiErrorMessage } from "../lib/api-error";
import { getJourneys, getStages } from "../features/missions/services/journey-service";
import {
  answerBattle,
  getBattle,
  getGroupJourneys,
  getJourneySummary,
  startBattle,
} from "../features/missions/services/battle-service";

/**
 * Contrato da tela de Missões (ADR-024): jornadas/etapas/corridas e o
 * fluxo start → estado → answer. O gabarito (`is_correct`) nunca pode
 * sobreviver ao schema do front.
 */
const server = setupServer();
const base = API_BASE_URL;
let lastBody: unknown = null;
let lastQuery: URLSearchParams | null = null;

before(() => server.listen({ onUnhandledFrame: "error" }));
beforeEach(() => { lastBody = null; lastQuery = null; server.resetHandlers(); });
after(() => server.close());

function battleState() {
  return {
    id: 12, status: "PROG", turn: 3, score: 40,
    started_at: "2026-01-01T10:00:00Z", finished_at: null,
    group_journey: { id: 4, status: "PROG", group: 3, group_name: "Lâmina de Prata", journey: 1 },
    stage: { id: 2, order: 2, name: "Ponte Quebrada", max_score: 100 },
    hero: { id: 7, name: "Emy", power_bonus: 2, hp: 18, max_hp: 30, shield: 5 },
    boss: { id: 5, name: "Olog", hp: 90, max_hp: 130, shield: 0 },
    question: {
      id: 9, text: "O que é uma função pura?", points: 10,
      // Hostis de propósito: se o servidor (ou um mock) escorregar o
      // gabarito, o schema do front descarta a chave.
      choices: [
        { id: 31, text: "Sem efeitos colaterais", is_correct: true },
        { id: 32, text: "Sempre recursiva", is_correct: false },
      ],
    },
    spells: [
      { id: 1, name: "Bola de Fogo", description: "2d10.", spell_type: "DMGE", base_value: 10, cooldown_turns: 2, ready: true, cooldown_left: 0 },
      { id: 2, name: "Escudo", description: "+5 PV.", spell_type: "SHLD", base_value: 5, cooldown_turns: 3, ready: false, cooldown_left: 2 },
    ],
    events: [
      { id: 1, turn: 2, actor: "STU", student: 7, question: 8, answered_correctly: true, spell: null, spell_name: null, value: 10, created_at: "2026-01-01T10:01:00Z" },
      { id: 2, turn: 3, actor: "BOS", student: null, question: null, answered_correctly: null, spell: 1, spell_name: "Bola de Fogo", value: 12, created_at: "2026-01-01T10:02:00Z" },
    ],
  };
}

test("jornadas e etapas: listagem com filtro ?journey", async () => {
  server.use(http.get(`${base}/journeys/`, () => HttpResponse.json([
    { id: 1, name: "Campanha", description: "8 incursões.", is_active: true, created_at: "2026-01-01T00:00:00Z" },
  ])));
  const journeys = await getJourneys();
  assert.equal(journeys[0]?.name, "Campanha");
  assert.equal(journeys[0]?.is_active, true);

  server.use(http.get(`${base}/stages/`, ({ request }) => {
    lastQuery = new URL(request.url).searchParams;
    return HttpResponse.json([
      { id: 2, journey: 1, journey_name: "Campanha", order: 2, name: "Ponte Quebrada", description: "", max_score: 100, boss_pool: [5], boss_names: ["Olog"] },
    ]);
  }));
  const stages = await getStages(1);
  assert.equal(lastQuery?.get("journey"), "1");
  assert.equal(stages[0]?.order, 2);
  assert.deepEqual(stages[0]?.boss_pool, [5]);
  assert.deepEqual(stages[0]?.boss_names, ["Olog"]);
});

test("corridas: listagem global do Salão aceita PROG/DONE/FAIL", async () => {
  server.use(http.get(`${base}/group-journeys/`, ({ request }) => {
    lastQuery = new URL(request.url).searchParams;
    return HttpResponse.json([
      { id: 4, group: 3, group_name: "Lâmina", journey: 1, journey_name: "Campanha", status: "PROG", current_stage: 2, started_at: "2026-01-01T10:00:00Z", finished_at: null, total_score: 40 },
      { id: 5, group: 4, group_name: "Escudo", journey: 1, journey_name: "Campanha", status: "DONE", current_stage: null, started_at: "2026-01-01T10:00:00Z", finished_at: "2026-01-02T10:00:00Z", total_score: 310 },
      { id: 6, group: 5, group_name: "Vento", journey: 1, journey_name: "Campanha", status: "FAIL", current_stage: null, started_at: "2026-01-01T10:00:00Z", finished_at: "2026-01-02T10:00:00Z", total_score: 90 },
    ]);
  }));
  const runs = await getGroupJourneys();
  assert.equal(lastQuery?.get("journey"), null, "Salão lista todas as corridas");
  assert.deepEqual(runs.map((r) => r.status), ["PROG", "DONE", "FAIL"]);
});

test("start → estado público da batalha sem gabarito", async () => {
  server.use(http.post(`${base}/battle/start/`, async ({ request }) => {
    lastBody = await request.json();
    return HttpResponse.json(battleState(), { status: 201 });
  }));
  const state = await startBattle(4);
  assert.deepEqual(lastBody, { group_journey: 4 });

  assert.equal(state.status, "PROG");
  assert.equal(state.hero.name, "Emy");
  assert.equal(state.boss.max_hp, 130);
  assert.equal(state.spells[1]?.ready, false);
  assert.equal(state.spells[1]?.cooldown_left, 2);
  assert.deepEqual(
    state.question?.choices.map((c) => Object.keys(c).sort()),
    [["id", "text"], ["id", "text"]],
    "só id/text — is_correct não sobrevive ao schema",
  );
});

test("answer envia choice/student/spell e lê o resultado novo", async () => {
  server.use(http.post(`${base}/battle/12/answer/`, async ({ request }) => {
    lastBody = await request.json();
    return HttpResponse.json({ correct: true, finished: false, victory: false, state: battleState() }, { status: 201 });
  }));
  const result = await answerBattle(12, { choice: 31, student: 7, spell: 1 });
  assert.deepEqual(lastBody, { choice: 31, student: 7, spell: 1 });
  assert.equal(result.correct, true);
  assert.equal(result.finished, false);
  assert.equal(result.victory, false);
  assert.equal(result.state.question?.id, 9);

  server.use(http.post(`${base}/battle/12/answer/`, () => HttpResponse.json(
    { correct: false, finished: true, victory: false, state: { ...battleState(), status: "FAIL", question: null, finished_at: "2026-01-01T11:00:00Z" } },
    { status: 201 },
  )));
  const fim = await answerBattle(12, { choice: 32 });
  assert.equal(fim.finished, true);
  assert.equal(fim.victory, false);
  assert.equal(fim.state.status, "FAIL");
  assert.equal(fim.state.question, null);
});

test("pré-condição violada chega como detail legível", async () => {
  server.use(http.post(`${base}/battle/start/`, () => HttpResponse.json(
    { detail: "O grupo não tem herói ativo nesta jornada." },
    { status: 400 },
  )));
  const error = await startBattle(4).then(
    () => assert.fail("deveria falhar"),
    (caught: unknown) => caught,
  );
  assert.equal(apiErrorMessage(error, "fallback"), "O grupo não tem herói ativo nesta jornada.");
});

test("resumo: nota decimal, status e nota de aluno podem ser null", async () => {
  server.use(http.get(`${base}/group-journeys/4/summary/`, () => HttpResponse.json({
    group_journey: 4, status: "DONE", total_score: 180, max_score: 400, suggested_grade: 7.5,
    stages: [
      { stage: 1, order: 1, name: "Trilha da Névoa", max_score: 100, score: 90, status: "DONE" },
      { stage: 2, order: 2, name: "Ponte Quebrada", max_score: 100, score: null, status: null },
    ],
    students: [
      { id: 7, name: "Ari", grade: 8.25, answered: 5, correct: 4, points: 40 },
      { id: 8, name: "Bia", grade: null, answered: 0, correct: 0, points: 0 },
    ],
  })));
  const summary = await getJourneySummary(4);
  assert.equal(summary.suggested_grade, 7.5);
  assert.equal(summary.stages[1]?.score, null);
  assert.equal(summary.stages[1]?.status, null);
  assert.equal(summary.students[0]?.grade, 8.25);
  assert.equal(summary.students[1]?.grade, null);
  assert.equal(summary.students[0]?.correct, 4);
});

test("leitura da batalha usa GET público por progress id", async () => {
  server.use(http.get(`${base}/battle/12/`, () => HttpResponse.json(battleState())));
  const state = await getBattle(12);
  assert.equal(state.id, 12);
  assert.equal(state.events[1]?.spell_name, "Bola de Fogo");
  assert.equal(state.events[0]?.student, 7);
});
