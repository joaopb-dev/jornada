"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, CalendarDays } from "@/components/icons/rpg-icons";
import { cn } from "@/lib/utils";

/**
 * Semestres lançados no sistema — hoje só o corrente; a lista cresce
 * quando turmas passadas forem cadastradas (a ideia é voltar e ver as
 * estatísticas de cada semestre).
 */
const SEMESTERS = ["2027.1"] as const;
const CURRENT_SEMESTER: string = SEMESTERS[0];

/** Lista expansível do semestre (canto superior direito da agenda). */
export function SemesterSelect() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>(CURRENT_SEMESTER);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapper} className="relative z-20 shrink-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="sand-chip flex items-center gap-2.5 px-4 py-2.5 text-left transition-transform hover:-translate-y-0.5"
      >
        <CalendarDays className="h-4 w-4 text-sand-deep" aria-hidden />
        <span>
          <span className="block text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-sand-ink-soft">
            Semestre
          </span>
          <span className="block font-display text-base leading-tight text-sand-ink">
            {selected}
          </span>
        </span>
        <ArrowDown
          className={cn("h-3.5 w-3.5 text-sand-deep transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Semestre"
          className="sand-card absolute right-0 mt-2 w-64 rounded-xl p-2"
        >
          {SEMESTERS.map((semester) => (
            <li key={semester}>
              <button
                type="button"
                role="option"
                aria-selected={semester === selected}
                onClick={() => {
                  setSelected(semester);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  semester === selected
                    ? "bg-sand-200 font-semibold text-sand-ink"
                    : "text-sand-ink hover:bg-white/50",
                )}
              >
                <span className="font-display">{semester}</span>
                {semester === CURRENT_SEMESTER && (
                  <span className="rounded-full border border-sand-line bg-white/60 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-widest text-sand-deep">
                    atual
                  </span>
                )}
              </button>
            </li>
          ))}
          <li className="mt-1 border-t border-sand-line/60 px-3 pb-1 pt-2 text-xs leading-relaxed text-sand-ink-soft">
            Semestres anteriores aparecem aqui quando forem lançados.
          </li>
        </ul>
      )}
    </div>
  );
}
