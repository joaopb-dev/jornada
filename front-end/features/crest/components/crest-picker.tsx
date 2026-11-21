"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "@/components/icons/rpg-icons";
import { Crest } from "./crest";
import {
  CREST_COLORS,
  CREST_SHAPES,
  CREST_SYMBOLS,
  colorOf,
  crestOf,
  cycle,
  shapeOf,
  symbolOf,
  type CrestSpec,
} from "../lib/crest";

interface StepperRowProps {
  label: string;
  value: string;
  index: number;
  total: number;
  swatch?: string;
  onPrev: () => void;
  onNext: () => void;
}

/** Linha do controle de setas: rótulo + ‹ opção (i/n) ›. */
function StepperRow({ label, value, index, total, swatch, onPrev, onNext }: StepperRowProps) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-background/60 px-2.5 py-1.5">
      <span className="flex items-center gap-2 text-sm font-medium">
        {swatch && (
          <span
            aria-hidden="true"
            className="h-3 w-3 shrink-0 rounded-full border border-black/20"
            style={{ background: swatch }}
          />
        )}
        {label}
      </span>
      <span className="flex items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label={`${label}: opção anterior`}
          onClick={onPrev}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="w-32 text-center text-sm">
          {value}
          <span className="ml-1 text-[0.7rem] text-muted-foreground">
            {index}/{total}
          </span>
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label={`${label}: próxima opção`}
          onClick={onNext}
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </span>
    </div>
  );
}

interface CrestPickerProps {
  /** Brasão atual (ausente/velho cai no padrão). */
  value?: Partial<CrestSpec> | null;
  /** Troca completa o brasão já normalizado. */
  onChange: (next: CrestSpec) => void;
}

/**
 * Gerador de brasão com **controle de setas** (Fase F): escolhe-se
 * **formato → cor → emblema**, um de cada vez, com prévia ao vivo.
 * Usado na criação/edição da equipe (lado do professor primeiro).
 */
export function CrestPicker({ value, onChange }: CrestPickerProps) {
  const spec = crestOf(value);
  const set = (patch: Partial<CrestSpec>) => onChange({ ...spec, ...patch });

  const shapeIndex = CREST_SHAPES.findIndex((item) => item.id === spec.shape) + 1;
  const colorIndex = CREST_COLORS.findIndex((item) => item.id === spec.color) + 1;
  const symbolIndex = CREST_SYMBOLS.findIndex((item) => item.id === spec.symbol) + 1;

  return (
    <div className="flex items-start gap-4">
      <div className="flex shrink-0 flex-col items-center gap-1">
        <Crest spec={spec} size={72} />
        <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">
          Prévia
        </span>
      </div>
      <div className="flex-1 space-y-2">
        <StepperRow
          label="Formato"
          value={shapeOf(spec.shape).label}
          index={shapeIndex}
          total={CREST_SHAPES.length}
          onPrev={() => set({ shape: cycle(CREST_SHAPES, spec.shape, -1).id })}
          onNext={() => set({ shape: cycle(CREST_SHAPES, spec.shape, 1).id })}
        />
        <StepperRow
          label="Cor"
          value={colorOf(spec.color).label}
          index={colorIndex}
          total={CREST_COLORS.length}
          swatch={colorOf(spec.color).fill}
          onPrev={() => set({ color: cycle(CREST_COLORS, spec.color, -1).id })}
          onNext={() => set({ color: cycle(CREST_COLORS, spec.color, 1).id })}
        />
        <StepperRow
          label="Símbolo"
          value={symbolOf(spec.symbol).label}
          index={symbolIndex}
          total={CREST_SYMBOLS.length}
          onPrev={() => set({ symbol: cycle(CREST_SYMBOLS, spec.symbol, -1).id })}
          onNext={() => set({ symbol: cycle(CREST_SYMBOLS, spec.symbol, 1).id })}
        />
      </div>
    </div>
  );
}
