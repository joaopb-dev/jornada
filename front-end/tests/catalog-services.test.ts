import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { API_BASE_URL } from "../lib/api-config";
import { apiErrorMessage, apiErrorList, apiFieldErrors } from "../lib/api-error";
import { createStudent, getStudents } from "../features/students/services/student-service";
import { createSkill, getSkills } from "../features/skills/services/skill-service";
import { createQuestion, getQuestions } from "../features/questions/services/question-service";
import { createHero, getHeroes, updateHero } from "../features/heroes/services/hero-service";
import { getBosses, updateBoss } from "../features/bosses/services/boss-service";
import { createGroup, getGroups, setGroupMembers } from "../features/groups/services/group-service";

/**
 * Contrato das seis telas migradas (ADR-024): os services falam nos paths
 * reais do Django e o schema zod espelha o DTO — vocabulário do servidor
 * (`matricula`, `spell_type`, `is_correct`, `max_hp`, `extra_points`…).
 */
const server = setupServer();
const base = API_BASE_URL;
let lastBody: unknown = null;

before(() => server.listen({ onUnhandledFrame: "error" }));
beforeEach(() => { lastBody = null; server.resetHandlers(); });
after(() => server.close());

async function jsonBody(request: Request): Promise<unknown> {
  lastBody = await request.json();
  return lastBody;
}

test("alunos: leitura espelha o DTO (matrícula, grupo, ativo)", async () => {
  server.use(http.get(`${base}/students/`, () => HttpResponse.json([
    { id: 7, name: "Ari", matricula: "558001", user: null, username: null, group: 3, group_name: "Lâmina de Prata", grade: null, is_active: true, created_at: "2026-01-01T00:00:00Z" },
    { id: 8, name: "Bia", matricula: "558002", user: null, username: null, group: null, group_name: null, grade: "8.50", is_active: false, created_at: "2026-01-01T00:00:00Z" },
  ])));
  const list = await getStudents();
  assert.equal(list[0]?.matricula, "558001");
  assert.equal(list[0]?.group_name, "Lâmina de Prata");
  assert.equal(list[0]?.group, 3);
  assert.equal(list[1]?.group, null);
  assert.equal(list[1]?.is_active, false);
});

test("alunos: create envia matrícula e o erro de duplicidade vira campo", async () => {
  server.use(http.post(`${base}/students/`, async ({ request }) => {
    await jsonBody(request);
    return HttpResponse.json({ matricula: ["Já existe um aluno com esta matrícula."] }, { status: 400 });
  }));
  await assert.rejects(
    createStudent({ name: "Ari", matricula: "558001" }),
    (error: unknown) => {
      assert.deepEqual(apiFieldErrors(error), { matricula: "Já existe um aluno com esta matrícula." });
      return true;
    },
  );
  assert.deepEqual(lastBody, { name: "Ari", matricula: "558001" }, "payload usa o campo do servidor");
});

test("habilidades: spell_type/cost/dice/review e POST no vocabulário do servidor", async () => {
  server.use(http.get(`${base}/spells/`, () => HttpResponse.json([
    { id: 1, name: "Bola de Fogo", description: "2d10 de dano.", cost: 3, dice: "2d10", review: false, spell_type: "DMGE", base_value: 10, max_value: 0, cooldown_turns: 0, is_active: true },
    { id: 2, name: "Escudo", description: "+5 PV.", cost: 2, dice: "1d6", review: true, spell_type: "SHLD", base_value: 5, max_value: 0, cooldown_turns: 1, is_active: true },
  ])));
  const list = await getSkills();
  assert.equal(list[0]?.spell_type, "DMGE");
  assert.equal(list[1]?.review, true);
  assert.equal(list[1]?.cost, 2);

  server.use(http.post(`${base}/spells/`, async ({ request }) => {
    await jsonBody(request);
    return HttpResponse.json({ id: 3, name: "Cura", description: "+8 PV.", cost: 5, dice: "1d8", review: false, spell_type: "HEAL", base_value: 8, max_value: 0, cooldown_turns: 0, is_active: true }, { status: 201 });
  }));
  await createSkill({ name: "Cura", description: "+8 PV.", cost: 5, dice: "1d8", review: false, spell_type: "HEAL" });
  assert.deepEqual(lastBody, { name: "Cura", description: "+8 PV.", cost: 5, dice: "1d8", review: false, spell_type: "HEAL" });
});

test("perguntas: choices aninhadas e POST usa text/choices (replace-all)", async () => {
  server.use(http.get(`${base}/questions/`, () => HttpResponse.json([
    { id: 9, boss: null, boss_name: null, text: "O que é um dicionário?", language: "Python", points: 10, choices: [
      { id: 31, text: "Mapeia chave→valor", is_correct: true },
      { id: 32, text: "Uma lista ordenada", is_correct: false },
    ] },
  ])));
  const list = await getQuestions();
  assert.equal(list[0]?.text, "O que é um dicionário?");
  assert.equal(list[0]?.choices[0]?.is_correct, true);
  assert.equal(list[0]?.boss, null);

  server.use(http.post(`${base}/questions/`, async ({ request }) => {
    await jsonBody(request);
    return HttpResponse.json({ id: 10, boss: null, boss_name: null, text: "O que é uma tupla?", language: "Python", points: 10, choices: [
      { id: 40, text: "Imutável", is_correct: true },
      { id: 41, text: "Mutável", is_correct: false },
    ] }, { status: 201 });
  }));
  await createQuestion({
    text: "O que é uma tupla?",
    language: "Python",
    choices: [{ text: "Imutável", is_correct: true }, { text: "Mutável", is_correct: false }],
  });
  assert.deepEqual(lastBody, {
    text: "O que é uma tupla?",
    language: "Python",
    choices: [{ text: "Imutável", is_correct: true }, { text: "Mutável", is_correct: false }],
  });
  assert.ok(!("statement" in (lastBody as object)), "vocabulário antigo (statement) não viaja");
  assert.ok(!("options" in (lastBody as object)), "vocabulário antigo (options) não viaja");
});

test("heróis: atributos completos e create leva group/journey explícitos (null)", async () => {
  server.use(http.get(`${base}/heroes/`, () => HttpResponse.json([
    { id: 2, name: "Emy", group: null, group_name: null, journey: null, journey_name: null, hero_class: "Magia", role: "Suporte", description: "Curandeira.", passive: "Regeneração.", attributes: { forca: 1, sabedoria: 5, carisma: 3 }, spells: [2], is_active: true },
    // Linha antiga sem ficha completa: o schema completa com zero.
    { id: 3, name: "Rook", group: 4, group_name: "Escudo", journey: 1, journey_name: "Campanha", hero_class: "Tanque", role: "Ataque", description: "Muralha.", passive: "Guarda.", attributes: { forca: 4 }, spells: [], is_active: false },
  ])));
  const list = await getHeroes();
  assert.deepEqual(list[0]?.attributes, { forca: 1, sabedoria: 5, carisma: 3 });
  assert.deepEqual(list[1]?.attributes, { forca: 4, sabedoria: 0, carisma: 0 });
  assert.equal(list[1]?.group_name, "Escudo");

  server.use(http.post(`${base}/heroes/`, async ({ request }) => {
    await jsonBody(request);
    return HttpResponse.json({ id: 4, name: "Emy", group: null, group_name: null, journey: null, journey_name: null, hero_class: "Magia", role: "Suporte", description: "Curandeira.", passive: "Regeneração.", attributes: { forca: 1, sabedoria: 5, carisma: 3 }, spells: [2], is_active: true }, { status: 201 });
  }));
  await createHero({
    name: "Emy", hero_class: "Magia", role: "Suporte", description: "Curandeira.",
    passive: "Regeneração.", spells: [2],
    attributes: { forca: 1, sabedoria: 5, carisma: 3 },
    group: null, journey: null,
  });
  const body = lastBody as Record<string, unknown>;
  assert.equal(body["group"], null, "create exige a chave group explícita");
  assert.equal(body["journey"], null, "create exige a chave journey explícita");

  server.use(http.patch(`${base}/heroes/2/`, async ({ request }) => {
    await jsonBody(request);
    return HttpResponse.json({ id: 2, name: "Emy", group: 4, group_name: "Escudo", journey: 1, journey_name: "Campanha", hero_class: "Magia", role: "Suporte", description: "Curandeira.", passive: "Regeneração.", attributes: { forca: 1, sabedoria: 5, carisma: 3 }, spells: [2], is_active: true }, { status: 200 });
  }));
  await updateHero(2, { group: 4, journey: 1 });
  assert.deepEqual(lastBody, { group: 4, journey: 1 }, "vínculo de corrida é {group, journey}");
});

test("chefes: habilidades aninhadas e toggle de sorteio envia só is_active", async () => {
  server.use(http.get(`${base}/bosses/`, () => HttpResponse.json([
    { id: 5, name: "Olog", specialty: "Tempo", description: "Cobrador.", image: "", max_hp: 130, is_active: true, spells: [],
      abilities: [{ id: 1, name: "Juros", trigger: "PERGUNTAS", effect: "PENALTY", value: 10, every: 2, threshold: 3, mode: "ANY", scope: "TEAM", min_count: 1, description: "Cobra a cada 2 erros." }] },
  ])));
  const list = await getBosses();
  assert.equal(list[0]?.max_hp, 130);
  assert.equal(list[0]?.abilities[0]?.trigger, "PERGUNTAS");

  server.use(http.patch(`${base}/bosses/5/`, async ({ request }) => {
    await jsonBody(request);
    return HttpResponse.json({ id: 5, name: "Olog", specialty: "Tempo", description: "Cobrador.", image: "", max_hp: 130, is_active: false, spells: [],
      abilities: [{ id: 1, name: "Juros", trigger: "PERGUNTAS", effect: "PENALTY", value: 10, every: 2, threshold: 3, mode: "ANY", scope: "TEAM", min_count: 1, description: "Cobra a cada 2 erros." }] }, { status: 200 });
  }));
  await updateBoss(5, { is_active: false });
  assert.deepEqual(lastBody, { is_active: false }, "o toggle não regrava a ficha inteira");
});

test("grupos: create completo e membros vão pelo set-members", async () => {
  server.use(http.get(`${base}/groups/`, () => HttpResponse.json([
    { id: 4, name: "Lâmina", letter: "A", points: 120, extra_points: 3, total_points: 123, member_count: 2, is_active: true, crest_shape: "classico", crest_color: "verde", crest_symbol: "espada" },
  ])));
  const list = await getGroups();
  assert.equal(list[0]?.letter, "A");
  assert.equal(list[0]?.extra_points, 3, "extra_points é inteiro do time");
  assert.equal(list[0]?.member_count, 2);

  server.use(http.post(`${base}/groups/`, async ({ request }) => {
    await jsonBody(request);
    return HttpResponse.json({ id: 9, name: "Novo", letter: "B", points: 0, extra_points: 0, total_points: 0, member_count: 0, is_active: true, crest_shape: "losango", crest_color: "azul", crest_symbol: "espada" }, { status: 201 });
  }));
  await createGroup({ name: "Novo", letter: "B", extra_points: 0, crest_shape: "losango", crest_color: "azul", crest_symbol: "espada" });
  assert.deepEqual(lastBody, { name: "Novo", letter: "B", extra_points: 0, crest_shape: "losango", crest_color: "azul", crest_symbol: "espada" });

  let membersPath = "";
  server.use(http.post(`${base}/groups/9/set-members/`, async ({ request }) => {
    membersPath = new URL(request.url).pathname;
    await jsonBody(request);
    return HttpResponse.json({ id: 9, name: "Novo", letter: "B", points: 0, extra_points: 0, total_points: 0, member_count: 2, is_active: true, crest_shape: "losango", crest_color: "azul", crest_symbol: "espada" }, { status: 200 });
  }));
  await setGroupMembers(9, [7, 8]);
  assert.equal(membersPath, "/api/groups/9/set-members/");
  assert.deepEqual(lastBody, { students: [7, 8] });
});

test("api-error: lista no topo, detail e campo caem nos meios certos", async () => {
  server.use(http.post(`${base}/battle/start/`, () => HttpResponse.json(
    ["Esta jornada do grupo não está em andamento."],
    { status: 400 },
  )));
  const listError = await import("axios").then(({ default: axios }) =>
    axios.post(`${base}/battle/start/`, {}, { headers: { "Content-Type": "application/json" } }).then(
      () => assert.fail("deveria falhar"),
      (error: unknown) => error,
    ),
  );
  assert.deepEqual(apiErrorList(listError, "fallback"), ["Esta jornada do grupo não está em andamento."]);
  assert.equal(apiErrorMessage(listError, "fallback"), "Esta jornada do grupo não está em andamento.");

  const fieldError = Object.assign(new Error("x"), { isAxiosError: true, response: { data: { matricula: ["Já existe."] } } });
  assert.deepEqual(apiFieldErrors(fieldError), { matricula: "Já existe." });
  assert.deepEqual(apiFieldErrors(new Error("rede")), {}, "erro de rede não tem campo");
  assert.deepEqual(apiFieldErrors({ response: { data: ["regra"] } }), {}, "lista no topo não tem campo");
});
