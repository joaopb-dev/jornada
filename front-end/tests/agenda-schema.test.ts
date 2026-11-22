import assert from "node:assert/strict";
import { test } from "node:test";
import { agendaSchema } from "../features/public-agenda/schemas/agenda";
import { agendaSeed } from "../mocks/landing-agenda";

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
  delete (noCrest.groups[0] as Partial<(typeof noCrest.groups)[0]>).crest_shape;
  assert.equal(agendaSchema.safeParse(noCrest).success, false);
});
