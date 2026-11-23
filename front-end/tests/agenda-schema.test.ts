import assert from "node:assert/strict";
import { test } from "node:test";
import { agendaSchema } from "../features/public-agenda/schemas/agenda";
import { leaderboardSchema } from "../features/public-agenda/schemas/leaderboard";
import { agendaSeed, leaderboardSeed } from "../mocks/landing-agenda";

test("a semente da agenda atende ao contrato", () => {
  assert.equal(agendaSchema.safeParse(agendaSeed).success, true);
});

test("equipe repetida, número repetido, data inválida ou sem brasão rejeitam", () => {
  const duplicatedGroup = {
    ...agendaSeed,
    groups: [...agendaSeed.groups, agendaSeed.groups[0]],
  };
  assert.equal(agendaSchema.safeParse(duplicatedGroup).success, false);

  const duplicatedNumber = structuredClone(agendaSeed);
  duplicatedNumber.incursions[1].number = duplicatedNumber.incursions[0].number;
  assert.equal(agendaSchema.safeParse(duplicatedNumber).success, false);

  const badDate = structuredClone(agendaSeed);
  badDate.incursions[0].date = "14/09/2026";
  assert.equal(agendaSchema.safeParse(badDate).success, false);

  const noCrest = structuredClone(agendaSeed);
  delete (noCrest.groups[0] as Partial<(typeof agendaSeed)["groups"][number]>).crest_shape;
  assert.equal(agendaSchema.safeParse(noCrest).success, false);
});

test("a semente do placar atende ao contrato do leaderboard", () => {
  assert.equal(leaderboardSchema.safeParse(leaderboardSeed).success, true);
  assert.deepEqual(leaderboardSeed.map((entry) => entry.position), [1, 2, 3, 4]);
  assert.ok(
    leaderboardSeed.every(
      (entry, index) =>
        index === 0 || leaderboardSeed[index - 1].total_points >= entry.total_points,
    ),
    "ordenado por total desc",
  );
  assert.equal(
    leaderboardSeed[0].total_points,
    leaderboardSeed[0].points + leaderboardSeed[0].extra_points,
    "total = batalhas + extras",
  );
});

test("entrada do placar sem position ou com position inválida rejeita", () => {
  const [first, ...rest] = leaderboardSeed;
  const withoutPosition = { ...first };
  delete (withoutPosition as Partial<typeof first>).position;
  assert.equal(leaderboardSchema.safeParse([withoutPosition, ...rest]).success, false);
  assert.equal(leaderboardSchema.safeParse([{ ...first, position: 0 }, ...rest]).success, false);
});
