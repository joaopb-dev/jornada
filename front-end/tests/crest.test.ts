import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CREST_COLORS,
  CREST_SHAPES,
  CREST_SYMBOLS,
  DEFAULT_CREST,
  colorOf,
  crestFromApi,
  crestOf,
  crestTitle,
  crestToApi,
  cycle,
  shapeOf,
  symbolOf,
} from "../features/crest";

test("catálogo: ids e rótulos únicos em formato, cor e símbolo", () => {
  for (const catalog of [CREST_SHAPES, CREST_COLORS, CREST_SYMBOLS]) {
    const ids = catalog.map((item) => item.id);
    const labels = catalog.map((item) => item.label);
    assert.equal(new Set(ids).size, ids.length, `ids repetidos: ${ids}`);
    assert.equal(new Set(labels).size, labels.length, `rótulos repetidos: ${labels}`);
    assert.ok(catalog.length >= 4, "catálogo pequeno demais para o gerador");
  }
});

test("formatos têm path SVG e cores têm fill/edge/ink", () => {
  for (const shape of CREST_SHAPES) assert.ok(shape.path.includes("M"), shape.id);
  for (const color of CREST_COLORS) {
    assert.match(color.fill, /^#[0-9A-F]{6}$/i, color.id);
    assert.match(color.edge, /^#[0-9A-F]{6}$/i, color.id);
    assert.match(color.ink, /^#[0-9A-F]{6}$/i, color.id);
  }
  for (const symbol of CREST_SYMBOLS) {
    assert.ok(symbol.paths.length > 0, symbol.id);
    for (const path of symbol.paths) assert.ok(path.length > 0);
  }
});

test("crestOf normaliza ausente, parcial e inválido campo a campo", () => {
  assert.deepEqual(crestOf(null), DEFAULT_CREST);
  assert.deepEqual(crestOf(undefined), DEFAULT_CREST);
  // inválido em um campo não derruba os válidos dos outros
  assert.deepEqual(crestOf({ shape: "triangulo", color: "roxo" }), {
    shape: DEFAULT_CREST.shape,
    color: "roxo",
    symbol: DEFAULT_CREST.symbol,
  });
  assert.deepEqual(crestOf({ symbol: "corvo" }), {
    shape: DEFAULT_CREST.shape,
    color: DEFAULT_CREST.color,
    symbol: "corvo",
  });
});

test("cycle anda para frente e para trás com volta ao início", () => {
  assert.equal(cycle(CREST_SHAPES, "classico", 1).id, "arredondado");
  assert.equal(cycle(CREST_SHAPES, "classico", -1).id, "hexagono");
  assert.equal(cycle(CREST_SHAPES, "hexagono", 1).id, "classico");
  assert.equal(cycle(CREST_COLORS, "preto", 1).id, "verde");
  // id desconhecido cai na primeira opção
  assert.equal(cycle(CREST_SYMBOLS, "duvida", 1).id, "espada");
});

test("rótulos caem no padrão quando o id é desconhecido", () => {
  assert.equal(shapeOf("triangulo").id, DEFAULT_CREST.shape);
  assert.equal(colorOf("laranja").id, DEFAULT_CREST.color);
  assert.equal(symbolOf("dragao").id, DEFAULT_CREST.symbol);
  assert.equal(shapeOf("losango").label, "Losango");
  assert.equal(colorOf("prata").label, "Prata");
  assert.equal(symbolOf("coroa").label, "Coroa");
});

test("ida e volta pela API (crestFromApi ↔ crestToApi)", () => {
  const spec = { shape: "hexagono", color: "preto", symbol: "lua" } as const;
  const api = crestToApi(spec);
  assert.deepEqual(api, {
    crest_shape: "hexagono",
    crest_color: "preto",
    crest_symbol: "lua",
  });
  assert.deepEqual(crestFromApi(api), spec);
  // resposta sem brasão (backend antigo) vira o padrão
  assert.deepEqual(crestFromApi({}), DEFAULT_CREST);
  assert.deepEqual(crestFromApi({ crest_shape: "fora" }), DEFAULT_CREST);
});

test("crestTitle monta o rótulo completo", () => {
  assert.equal(crestTitle({ shape: "losango", color: "roxo", symbol: "corvo" }), "Losango · Roxo · Corvo");
  assert.equal(crestTitle(null), "Clássico · Verde · Espada");
});
