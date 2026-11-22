import { colorOf, crestOf, crestTitle, shapeOf, symbolOf, type CrestSpec } from "../lib/crest";

interface CrestProps {
  /** Brasão da equipe — aceita parcial/ausente e cai no padrão. */
  spec?: Partial<CrestSpec> | null;
  /** Largura em px (a altura segue a proporção 64×72 do escudo). */
  size?: number;
  className?: string;
  /**
   * Sem rótulo o escudo é decorativo (ao lado do nome da equipe, que já
   * descreve o contexto); com rótulo vira `role="img"` com aria-label.
   */
  label?: string;
}

/**
 * Render do brasão (ADR-016): **formato + cor + emblema** compostos em
 * SVG puro — re-renderizável, leve e editável, sem imagem fixa.
 */
export function Crest({ spec, size = 40, className, label }: CrestProps) {
  const { shape, color, symbol } = crestOf(spec);
  const palette = colorOf(color);
  const glyph = symbolOf(symbol);

  return (
    <svg
      viewBox="0 0 64 72"
      width={size}
      height={(size * 72) / 64}
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      data-crest={shape}
      data-color={color}
      data-symbol={symbol}
    >
      {label ? <title>{crestTitle(spec)}</title> : null}
      <path
        d={shapeOf(shape).path}
        fill={palette.fill}
        stroke={palette.edge}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <g
        transform="translate(8 10) scale(2)"
        fill="none"
        stroke={palette.ink}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {glyph.paths.map((path) => (
          <path key={path} d={path} />
        ))}
      </g>
    </svg>
  );
}

/**
 * Contorno **pontilhado cinza** do escudo: denota que a linha não tem
 * brasão porque o aventureiro está **sem equipe** — em vez de exibir o
 * brasão padrão (que mentiria dizendo "tem equipe").
 */
export function CrestPlaceholder({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 72"
      width={size}
      height={(size * 72) / 64}
      className={className}
      aria-hidden
      focusable="false"
      data-crest="placeholder"
    >
      <path
        d={shapeOf("classico").path}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeDasharray="5 5"
        className="text-muted-foreground"
      />
    </svg>
  );
}
