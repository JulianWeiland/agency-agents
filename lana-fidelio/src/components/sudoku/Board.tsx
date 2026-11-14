"use client";

import type { CSSProperties } from "react";
import { CELLS, PEERS, boxOf, colOf, rowOf } from "@/lib/sudoku/puzzle";
import type { SudokuState } from "@/lib/sudoku/engine";

export type BoardPhase = "play" | "pulse" | "solved";

export interface BoardProps {
  state: SudokuState;
  conflicts: readonly boolean[];
  wrong: readonly boolean[];
  phase: BoardPhase;
  /** cells that were just filled all at once — their digits cascade in diagonally */
  cascade?: ReadonlySet<number> | null;
  /** the cell the last hint landed on (golden flash) */
  flash?: number | null;
  onSelect(index: number): void;
}

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const flag = (on: boolean) => (on ? "" : undefined);

function describe(state: SudokuState, i: number, wrong: boolean): string {
  const v = state.values[i];
  const where = `Row ${rowOf(i) + 1}, column ${colOf(i) + 1}`;
  if (!v) {
    const notes = DIGITS.filter((d) => state.notes[i] & (1 << d));
    return notes.length ? `${where}, empty, notes ${notes.join(" ")}` : `${where}, empty`;
  }
  const kind = state.givens[i] ? "given" : state.locked[i] ? "hint" : wrong ? "incorrect" : "your entry";
  return `${where}, ${v}, ${kind}`;
}

/** The 9×9 grid. Purely presentational: every cell is a button, all colour comes from data-attributes. */
export function Board({ state, conflicts, wrong, phase, cascade = null, flash = null, onSelect }: BoardProps) {
  const playing = phase === "play";
  const sel = playing ? state.selected : null;
  const selValue = sel !== null ? state.values[sel] : 0;
  const peers = sel !== null ? PEERS[sel] : null;

  return (
    <div className="sdk-frame">
      {phase === "pulse" && <div className="sdk-halo" aria-hidden />}
      <div className="sdk-board" role="grid" aria-label="Sudoku board" data-phase={phase}>
        {Array.from({ length: CELLS }, (_, i) => {
          const v = state.values[i];
          const r = rowOf(i);
          const c = colOf(i);
          const kind = state.givens[i] ? "given" : state.locked[i] ? "hint" : "player";
          const selected = sel === i;
          const isWrong = playing && wrong[i];
          return (
            <button
              key={i}
              type="button"
              role="gridcell"
              className="sdk-cell"
              tabIndex={playing ? (selected || (sel === null && i === 0) ? 0 : -1) : -1}
              aria-label={describe(state, i, isWrong)}
              aria-selected={selected}
              data-i={i}
              data-r={r}
              data-c={c}
              data-b={boxOf(i)}
              data-kind={kind}
              data-sel={flag(selected)}
              data-peer={flag(!selected && !!peers && peers.includes(i))}
              data-same={flag(!selected && selValue !== 0 && v === selValue)}
              data-wrong={flag(isWrong)}
              data-conflict={flag(playing && !isWrong && conflicts[i])}
              data-flash={flag(playing && flash === i)}
              data-cascade={flag(!!cascade && cascade.has(i))}
              style={{ "--d": r + c } as CSSProperties}
              onPointerDown={(e) => {
                if (!playing) return;
                if (e.pointerType === "mouse" && e.button !== 0) return;
                onSelect(i);
              }}
              onClick={() => {
                // keyboard / assistive activation (pointer taps were handled on pointerdown)
                if (playing && sel !== i) onSelect(i);
              }}
            >
              {v ? (
                <span className="sdk-digit">{v}</span>
              ) : state.notes[i] ? (
                <span className="sdk-notes" aria-hidden>
                  {DIGITS.map((d) => (
                    <span key={d} data-hit={flag(selValue === d)}>
                      {state.notes[i] & (1 << d) ? d : ""}
                    </span>
                  ))}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {phase === "pulse" && <div className="sdk-sweep" aria-hidden />}
    </div>
  );
}

export default Board;
