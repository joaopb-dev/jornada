/**
 * Catálogo do gerador de brasão (Fase F, ADR-016) — dados puros:
 * **formato → cor → emblema**, o que o professor (e depois a equipe)
 * escolhe no controle de setas.
 *
 * Os ids espelham os choices do model `Group`
 * (`back-end/apps/groups/models.py`: CrestShape/CrestColor/CrestSymbol).
 * Glifos de emblema derivados do lucide-react (ISC) na grade 24×24,
 * desenhados em traço; o escudo vive na grade 64×72.
 */

export interface CrestSpec {
  shape: CrestShapeId;
  color: CrestColorId;
  symbol: CrestSymbolId;
}

/** Formatos do escudo (grade 64×72, path preenchido). */
export const CREST_SHAPES = [
  {
    id: "classico",
    label: "Clássico",
    path: "M5 4H59V34C59 51 46 63 32 69C18 63 5 51 5 34Z",
  },
  {
    id: "arredondado",
    label: "Arredondado",
    path: "M5 18C5 8 16 4 32 4C48 4 59 8 59 18V36C59 53 46 64 32 69C18 64 5 53 5 36Z",
  },
  {
    id: "losango",
    label: "Losango",
    path: "M32 3L61 36L32 69L3 36Z",
  },
  {
    id: "hexagono",
    label: "Hexágono",
    path: "M18 4H46L60 36L46 68H18L4 36Z",
  },
] as const;

export type CrestShapeId = (typeof CREST_SHAPES)[number]["id"];

/** Cores do escudo: fundo (fill), borda (edge) e tinta do emblema (ink). */
export const CREST_COLORS = [
  { id: "verde", label: "Verde", fill: "#3F6B4A", edge: "#2E5038", ink: "#F4ECD8" },
  { id: "azul", label: "Azul", fill: "#35527C", edge: "#26405F", ink: "#F4ECD8" },
  { id: "vermelho", label: "Vermelho", fill: "#8E3232", edge: "#6E2525", ink: "#F4ECD8" },
  { id: "roxo", label: "Roxo", fill: "#5C3F7E", edge: "#46305F", ink: "#F4ECD8" },
  { id: "dourado", label: "Dourado", fill: "#C89B3C", edge: "#A07A2B", ink: "#3A2E17" },
  { id: "prata", label: "Prata", fill: "#A8ADB3", edge: "#858B92", ink: "#2E3236" },
  { id: "preto", label: "Preto", fill: "#33302B", edge: "#211F1C", ink: "#EFE4CC" },
] as const;

export type CrestColorId = (typeof CREST_COLORS)[number]["id"];

/**
 * Emblemas centrais (traço, grade 24×24 — o renderer aplica
 * `translate(8 10) scale(2)`). Espada/corvo/chama/estrela/lua/caveira/
 * coroa vêm do lucide (ISC); a árvore é desenho próprio.
 */
export const CREST_SYMBOLS = [
  {
    id: "espada",
    label: "Espada",
    paths: [
      "m11 19-6-6",
      "m5 21-2-2",
      "m8 16-4 4",
      "M9.5 17.5 21 6V3h-3L6.5 14.5",
    ],
  },
  {
    id: "corvo",
    label: "Corvo",
    paths: [
      "M16 7h.01",
      "M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20",
      "m20 7 2 .5-2 .5",
      "M10 18v3",
      "M14 17.75V21",
      "M7 18a6 6 0 0 0 3.84-10.61",
    ],
  },
  {
    id: "arvore",
    label: "Árvore",
    paths: [
      "M12 2L7.5 8.5H16.5Z",
      "M12 7L5.5 14H18.5Z",
      "M12 12L4 19.5H20Z",
      "M12 19.5V22.5",
    ],
  },
  {
    id: "chama",
    label: "Chama",
    paths: [
      "M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4",
    ],
  },
  {
    id: "estrela",
    label: "Estrela",
    paths: [
      "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",
    ],
  },
  {
    id: "lua",
    label: "Lua",
    paths: [
      "M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401",
    ],
  },
  {
    id: "caveira",
    label: "Caveira",
    paths: [
      "m12.5 17-.5-1-.5 1h1z",
      "M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z",
      "M15 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
      "M9 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
    ],
  },
  {
    id: "coroa",
    label: "Coroa",
    paths: [
      "M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z",
      "M5 21h14",
    ],
  },
] as const;

export type CrestSymbolId = (typeof CREST_SYMBOLS)[number]["id"];

export const CREST_SHAPE_IDS = CREST_SHAPES.map((item) => item.id) as [
  CrestShapeId,
  ...CrestShapeId[],
];
export const CREST_COLOR_IDS = CREST_COLORS.map((item) => item.id) as [
  CrestColorId,
  ...CrestColorId[],
];
export const CREST_SYMBOL_IDS = CREST_SYMBOLS.map((item) => item.id) as [
  CrestSymbolId,
  ...CrestSymbolId[],
];

/** Brasão padrão (equipe criada sem escolha explícita). */
export const DEFAULT_CREST: CrestSpec = {
  shape: "classico",
  color: "verde",
  symbol: "espada",
};

const hasShape = (value: unknown): value is CrestShapeId =>
  CREST_SHAPE_IDS.includes(value as CrestShapeId);
const hasColor = (value: unknown): value is CrestColorId =>
  CREST_COLOR_IDS.includes(value as CrestColorId);
const hasSymbol = (value: unknown): value is CrestSymbolId =>
  CREST_SYMBOL_IDS.includes(value as CrestSymbolId);

/**
 * Normaliza qualquer entrada — dado velho do `localStorage`, resposta da
 * API ou `undefined` — para um brasão válido (campo a campo).
 */
export function crestOf(value?: {
  shape?: unknown;
  color?: unknown;
  symbol?: unknown;
} | null): CrestSpec {
  return {
    shape: hasShape(value?.shape) ? value.shape : DEFAULT_CREST.shape,
    color: hasColor(value?.color) ? value.color : DEFAULT_CREST.color,
    symbol: hasSymbol(value?.symbol) ? value.symbol : DEFAULT_CREST.symbol,
  };
}

/**
 * Passa para a vizinha do catálogo (controle de setas), com volta ao
 * início; id desconhecido cai na primeira opção.
 */
export function cycle<T extends { id: string }>(
  items: readonly T[],
  currentId: string,
  step: 1 | -1 = 1,
): T {
  const index = items.findIndex((item) => item.id === currentId);
  if (index < 0) return items[0];
  return items[(index + step + items.length) % items.length];
}

export function shapeOf(id: string) {
  return CREST_SHAPES.find((item) => item.id === id) ?? CREST_SHAPES[0];
}

export function colorOf(id: string) {
  return CREST_COLORS.find((item) => item.id === id) ?? CREST_COLORS[0];
}

export function symbolOf(id: string) {
  return CREST_SYMBOLS.find((item) => item.id === id) ?? CREST_SYMBOLS[0];
}

/** Rótulo completo ("Clássico · Verde · Espada") — tooltip/aria. */
export function crestTitle(spec?: Partial<CrestSpec> | null): string {
  const { shape, color, symbol } = crestOf(spec);
  return `${shapeOf(shape).label} · ${colorOf(color).label} · ${symbolOf(symbol).label}`;
}

/** Campos planos da API (`crest_shape`…) → spec do front. */
export function crestFromApi(value: {
  crest_shape?: unknown;
  crest_color?: unknown;
  crest_symbol?: unknown;
}): CrestSpec {
  return crestOf({
    shape: value.crest_shape,
    color: value.crest_color,
    symbol: value.crest_symbol,
  });
}

/** Spec do front → payload de `PATCH /groups/{id}/`. */
export function crestToApi(spec?: Partial<CrestSpec> | null): {
  crest_shape: CrestShapeId;
  crest_color: CrestColorId;
  crest_symbol: CrestSymbolId;
} {
  const { shape, color, symbol } = crestOf(spec);
  return { crest_shape: shape, crest_color: color, crest_symbol: symbol };
}
