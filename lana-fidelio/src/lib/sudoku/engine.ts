/**
 * Pure Sudoku engine: a reducer plus derived selectors and (guarded) persistence helpers.
 * No React, no DOM access outside the explicit load/save/clear helpers.
 */
import { BOXES, CELLS, PEERS, PUZZLE, PUZZLE_ID, SOLUTION, UNITS, type Grid } from "./puzzle";

export const SUDOKU_STORAGE_KEY = "lana.fidelio.sudoku.v1";
const SAVE_VERSION = 1;
const HISTORY_LIMIT = 120;
const HISTORY_SAVE_LIMIT = 40;

/** [cell index, previous value, previous notes bitmask] */
export type CellSnapshot = readonly [index: number, value: number, notes: number];
export type HistoryEntry = readonly CellSnapshot[];

export interface SudokuState {
  puzzleId: string;
  /** 0 = empty; never changes */
  givens: readonly number[];
  solution: readonly number[];
  /** current board (givens included) */
  values: readonly number[];
  /** pencil marks per cell: bit d (1–9) set = digit d noted */
  notes: readonly number[];
  /** cells filled by a hint — as immutable as givens */
  locked: readonly boolean[];
  selected: number | null;
  notesMode: boolean;
  /** light undo stack: only the cells an action touched */
  history: readonly HistoryEntry[];
  hints: number;
  /** wrong digits entered so far (never decreases) */
  mistakes: number;
  /** the one-time "Careful, Rookie" whisper has been shown */
  warned: boolean;
  /** ms epoch of the first time the board was opened */
  startedAt: number;
  /** the remaining solution was revealed on request */
  assisted: boolean;
}

export type SudokuAction =
  | { type: "select"; index: number | null }
  | { type: "input"; digit: number }
  | { type: "erase" }
  | { type: "toggleNotes" }
  | { type: "undo" }
  /** fills the selected (empty or wrong) cell, else a random one; `pick` ∈ [0,1) keeps the reducer pure */
  | { type: "hint"; pick?: number }
  /** player asked for the rest: fills everything, marks the solve as assisted */
  | { type: "revealAll" }
  /** test bypass: fills everything, counts as a normal solve */
  | { type: "fillSolution" }
  | { type: "markWarned" }
  | { type: "reset"; now?: number };

/* ───────────────────────────── construction ───────────────────────────── */

export function createInitialState(
  now = 0,
  givens: Grid = PUZZLE,
  solution: Grid = SOLUTION,
  puzzleId: string = PUZZLE_ID,
): SudokuState {
  return {
    puzzleId,
    givens: [...givens],
    solution: [...solution],
    values: [...givens],
    notes: new Array<number>(CELLS).fill(0),
    locked: new Array<boolean>(CELLS).fill(false),
    selected: null,
    notesMode: false,
    history: [],
    hints: 0,
    mistakes: 0,
    warned: false,
    startedAt: now,
    assisted: false,
  };
}

/* ───────────────────────────── selectors ───────────────────────────── */

export const isGiven = (s: SudokuState, i: number) => s.givens[i] !== 0;
/** player may change this cell */
export const isEditable = (s: SudokuState, i: number) =>
  i >= 0 && i < CELLS && s.givens[i] === 0 && !s.locked[i];

/** Every cell matches the (unique) solution. Any wrong or invalid full board is NOT complete. */
export function isComplete(s: Pick<SudokuState, "values" | "solution">): boolean {
  for (let i = 0; i < CELLS; i++) if (s.values[i] !== s.solution[i] || !s.values[i]) return false;
  return true;
}

/** Cells whose digit is repeated in their row, column or box (givens included). */
export function getConflicts(values: readonly number[]): boolean[] {
  const out = new Array<boolean>(CELLS).fill(false);
  for (const unit of UNITS) {
    for (let a = 0; a < 9; a++) {
      const va = values[unit[a]];
      if (!va) continue;
      for (let b = a + 1; b < 9; b++) {
        if (values[unit[b]] === va) {
          out[unit[a]] = true;
          out[unit[b]] = true;
        }
      }
    }
  }
  return out;
}

/** Player-entered cells that disagree with the solution. */
export function getWrong(s: Pick<SudokuState, "values" | "solution" | "givens">): boolean[] {
  return s.values.map((v, i) => v !== 0 && s.givens[i] === 0 && v !== s.solution[i]);
}

/** remaining[d] = how many more of digit d the board still needs (index 0 unused). Never negative. */
export function getRemaining(values: readonly number[]): number[] {
  const out = new Array<number>(10).fill(9);
  out[0] = 0;
  for (const v of values) if (v >= 1 && v <= 9) out[v]--;
  return out.map((n) => Math.max(0, n));
}

/** boxes[b] = every cell of box b is filled correctly. */
export function getCompletedBoxes(s: Pick<SudokuState, "values" | "solution">): boolean[] {
  return BOXES.map((cells) => cells.every((i) => s.values[i] !== 0 && s.values[i] === s.solution[i]));
}

/** Cells the player filled themselves (not givens, not hints). */
export function countPlayerFilled(s: SudokuState): number {
  let n = 0;
  for (let i = 0; i < CELLS; i++) if (s.values[i] && !s.givens[i] && !s.locked[i]) n++;
  return n;
}

export function countEmpty(s: Pick<SudokuState, "values">): number {
  let n = 0;
  for (const v of s.values) if (!v) n++;
  return n;
}

export const REVEAL_MIN_FILLED = 8;
export const REVEAL_MIN_HINTS = 3;
export const REVEAL_MIN_MS = 4 * 60 * 1000;

/** "Reveal remaining solution" is only offered after a genuine attempt. */
export function canOfferReveal(s: SudokuState, now: number): boolean {
  if (isComplete(s)) return false;
  return (
    countPlayerFilled(s) >= REVEAL_MIN_FILLED ||
    s.hints >= REVEAL_MIN_HINTS ||
    (s.startedAt > 0 && now - s.startedAt >= REVEAL_MIN_MS)
  );
}

/** The cell a hint would fill: the selected one when it is empty/wrong, otherwise a pseudo-random open cell. */
export function pickHintCell(s: SudokuState, pick = 0): number | null {
  const open = (i: number) => isEditable(s, i) && s.values[i] !== s.solution[i];
  if (s.selected !== null && open(s.selected)) return s.selected;
  const pool: number[] = [];
  for (let i = 0; i < CELLS; i++) if (open(i)) pool.push(i);
  if (pool.length === 0) return null;
  const p = Number.isFinite(pick) ? Math.min(Math.max(pick, 0), 0.999999) : 0;
  return pool[Math.floor(p * pool.length)];
}

/* ───────────────────────────── reducer ───────────────────────────── */

function pushHistory(history: readonly HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  const next = history.length >= HISTORY_LIMIT ? history.slice(history.length - HISTORY_LIMIT + 1) : [...history];
  next.push(entry);
  return next;
}

/** Place `digit` at `index` and sweep it out of the peers' pencil marks. Returns the touched snapshots. */
function place(
  s: SudokuState,
  index: number,
  digit: number,
): { values: number[]; notes: number[]; entry: CellSnapshot[] } {
  const values = [...s.values];
  const notes = [...s.notes];
  const entry: CellSnapshot[] = [[index, s.values[index], s.notes[index]]];
  values[index] = digit;
  notes[index] = 0;
  const bit = 1 << digit;
  for (const p of PEERS[index]) {
    if (notes[p] & bit) {
      entry.push([p, values[p], notes[p]]);
      notes[p] &= ~bit;
    }
  }
  return { values, notes, entry };
}

function fillAll(s: SudokuState, assisted: boolean): SudokuState {
  if (isComplete(s)) return s;
  return {
    ...s,
    values: [...s.solution],
    notes: new Array<number>(CELLS).fill(0),
    history: [],
    notesMode: false,
    selected: null,
    assisted: s.assisted || assisted,
  };
}

export function sudokuReducer(s: SudokuState, action: SudokuAction): SudokuState {
  switch (action.type) {
    case "select": {
      const index = action.index;
      if (index !== null && (!Number.isInteger(index) || index < 0 || index >= CELLS)) return s;
      return index === s.selected ? s : { ...s, selected: index };
    }

    case "toggleNotes":
      return isComplete(s) ? s : { ...s, notesMode: !s.notesMode };

    case "input": {
      const { digit } = action;
      const i = s.selected;
      if (i === null || !Number.isInteger(digit) || digit < 1 || digit > 9) return s;
      if (!isEditable(s, i) || isComplete(s)) return s;

      if (s.notesMode) {
        if (s.values[i] !== 0) return s; // pencil marks only live in empty cells
        const notes = [...s.notes];
        notes[i] ^= 1 << digit;
        return { ...s, notes, history: pushHistory(s.history, [[i, 0, s.notes[i]]]) };
      }

      if (s.values[i] === digit) {
        // tapping the same digit again clears the cell
        const values = [...s.values];
        values[i] = 0;
        return { ...s, values, history: pushHistory(s.history, [[i, digit, s.notes[i]]]) };
      }

      const { values, notes, entry } = place(s, i, digit);
      return {
        ...s,
        values,
        notes,
        history: pushHistory(s.history, entry),
        mistakes: digit === s.solution[i] ? s.mistakes : s.mistakes + 1,
      };
    }

    case "erase": {
      const i = s.selected;
      if (i === null || !isEditable(s, i) || isComplete(s)) return s;
      if (s.values[i] === 0 && s.notes[i] === 0) return s;
      const values = [...s.values];
      const notes = [...s.notes];
      values[i] = 0;
      notes[i] = 0;
      return { ...s, values, notes, history: pushHistory(s.history, [[i, s.values[i], s.notes[i]]]) };
    }

    case "undo": {
      if (s.history.length === 0 || isComplete(s)) return s;
      const entry = s.history[s.history.length - 1];
      const values = [...s.values];
      const notes = [...s.notes];
      for (const [i, v, n] of entry) {
        if (!isEditable(s, i)) continue; // never rewrite a given or a hinted cell
        values[i] = v;
        notes[i] = n;
      }
      return { ...s, values, notes, history: s.history.slice(0, -1), selected: entry[0]?.[0] ?? s.selected };
    }

    case "hint": {
      if (isComplete(s)) return s;
      const i = pickHintCell(s, action.pick);
      if (i === null) return s;
      const { values, notes } = place(s, i, s.solution[i]);
      const locked = [...s.locked];
      locked[i] = true;
      return { ...s, values, notes, locked, selected: i, hints: s.hints + 1 };
    }

    case "revealAll":
      return fillAll(s, true);

    case "fillSolution":
      return fillAll(s, false);

    case "markWarned":
      return s.warned ? s : { ...s, warned: true };

    case "reset":
      return createInitialState(action.now ?? 0, s.givens, s.solution, s.puzzleId);

    default:
      return s;
  }
}

/* ───────────────────────────── persistence ───────────────────────────── */

interface SavedSudoku {
  v: number;
  puzzleId: string;
  values: number[];
  notes: number[];
  locked: number[]; // indices
  selected: number | null;
  notesMode: boolean;
  history: HistoryEntry[];
  hints: number;
  mistakes: number;
  warned: boolean;
  startedAt: number;
  assisted: boolean;
}

export function serialize(s: SudokuState): string {
  const saved: SavedSudoku = {
    v: SAVE_VERSION,
    puzzleId: s.puzzleId,
    values: [...s.values],
    notes: [...s.notes],
    locked: s.locked.flatMap((l, i) => (l ? [i] : [])),
    selected: s.selected,
    notesMode: s.notesMode,
    history: s.history.slice(-HISTORY_SAVE_LIMIT),
    hints: s.hints,
    mistakes: s.mistakes,
    warned: s.warned,
    startedAt: s.startedAt,
    assisted: s.assisted,
  };
  return JSON.stringify(saved);
}

const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

/** Rebuild a state from a saved string. Returns null for anything stale, foreign or malformed. */
export function deserialize(raw: string | null | undefined, base: SudokuState = createInitialState()): SudokuState | null {
  if (!raw) return null;
  let p: Partial<SavedSudoku>;
  try {
    p = JSON.parse(raw) as Partial<SavedSudoku>;
  } catch {
    return null;
  }
  if (!p || typeof p !== "object" || p.v !== SAVE_VERSION || p.puzzleId !== base.puzzleId) return null;
  if (!Array.isArray(p.values) || p.values.length !== CELLS || !p.values.every((v) => isInt(v, 0, 9))) return null;
  if (!Array.isArray(p.notes) || p.notes.length !== CELLS || !p.notes.every((v) => isInt(v, 0, 0x3fe))) return null;

  const locked = new Array<boolean>(CELLS).fill(false);
  if (Array.isArray(p.locked)) {
    for (const i of p.locked) if (isInt(i, 0, CELLS - 1) && base.givens[i] === 0) locked[i] = true;
  }
  // givens and hinted cells can never be anything but themselves
  const values = p.values.map((v, i) => (base.givens[i] ? base.givens[i] : locked[i] ? base.solution[i] : v));
  const notes = p.notes.map((n, i) => (values[i] ? 0 : n & 0x3fe));

  const history: HistoryEntry[] = [];
  if (Array.isArray(p.history)) {
    for (const entry of p.history) {
      if (!Array.isArray(entry) || entry.length === 0) continue;
      const ok = entry.every(
        (c) => Array.isArray(c) && c.length === 3 && isInt(c[0], 0, CELLS - 1) && isInt(c[1], 0, 9) && isInt(c[2], 0, 0x3fe),
      );
      if (ok) history.push(entry.map((c) => [c[0], c[1], c[2]] as const));
    }
  }

  return {
    ...base,
    values,
    notes,
    locked,
    selected: isInt(p.selected, 0, CELLS - 1) ? p.selected : null,
    notesMode: p.notesMode === true,
    history,
    hints: isInt(p.hints, 0, CELLS) ? p.hints : 0,
    mistakes: isInt(p.mistakes, 0, 100000) ? p.mistakes : 0,
    warned: p.warned === true,
    startedAt: typeof p.startedAt === "number" && Number.isFinite(p.startedAt) && p.startedAt > 0 ? p.startedAt : base.startedAt,
    assisted: p.assisted === true,
  };
}

function storage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

/** Saved board, or null. Never throws (private mode, blocked storage, corrupt JSON…). */
export function loadSudoku(now = Date.now()): SudokuState | null {
  try {
    return deserialize(storage()?.getItem(SUDOKU_STORAGE_KEY), createInitialState(now));
  } catch {
    return null;
  }
}

export function saveSudoku(s: SudokuState): boolean {
  try {
    const store = storage();
    if (!store) return false;
    store.setItem(SUDOKU_STORAGE_KEY, serialize(s));
    return true;
  } catch {
    return false;
  }
}

export function clearSudoku(): void {
  try {
    storage()?.removeItem(SUDOKU_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
