/**
 * The Princess's Sudoku — ONE fixed, pre-validated medium puzzle.
 * 30 givens, 180° rotational symmetry, exactly one solution (proved in puzzle.test.ts),
 * solvable with naked + hidden singles only (no guessing), roughly 5–10 minutes for an enthusiast.
 */

export const SIZE = 9;
export const CELLS = 81;

/** 81 digits, row by row; 0 = empty. */
export type Grid = readonly number[];

export const PUZZLE_ID = "princess-01";

const GIVENS_ROWS = [
  "..9..6.3.",
  ".6..7.9..",
  "1..9..24.",
  ".9..6.4..",
  "5..8.4..2",
  "..4.9..6.",
  ".32..8..4",
  "..5.1..2.",
  ".8.7..3..",
] as const;

const SOLUTION_ROWS = [
  "849126537",
  "263475981",
  "157983246",
  "398267415",
  "516834792",
  "724591863",
  "932658174",
  "475319628",
  "681742359",
] as const;

export function parseGrid(rows: readonly string[] | string): number[] {
  const flat = (typeof rows === "string" ? rows : rows.join("")).replace(/\s+/g, "");
  if (flat.length !== CELLS) throw new Error(`Sudoku grid needs ${CELLS} cells, got ${flat.length}`);
  return Array.from(flat, (ch) => (ch >= "1" && ch <= "9" ? Number(ch) : 0));
}

export const PUZZLE: Grid = Object.freeze(parseGrid(GIVENS_ROWS));
export const SOLUTION: Grid = Object.freeze(parseGrid(SOLUTION_ROWS));

/* ───────────────────────────── geometry ───────────────────────────── */

export const rowOf = (i: number) => Math.floor(i / 9);
export const colOf = (i: number) => i % 9;
export const boxOf = (i: number) => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);

/** 27 units: 9 rows, 9 columns, 9 boxes — each a list of 9 cell indices. */
export const UNITS: readonly (readonly number[])[] = (() => {
  const units: number[][] = [];
  for (let k = 0; k < 9; k++) units.push(Array.from({ length: 9 }, (_, j) => k * 9 + j));
  for (let k = 0; k < 9; k++) units.push(Array.from({ length: 9 }, (_, j) => j * 9 + k));
  for (let k = 0; k < 9; k++) {
    const br = Math.floor(k / 3) * 3;
    const bc = (k % 3) * 3;
    units.push(Array.from({ length: 9 }, (_, j) => (br + Math.floor(j / 3)) * 9 + bc + (j % 3)));
  }
  return units;
})();

/** Cells of box b (0–8). */
export const BOXES: readonly (readonly number[])[] = UNITS.slice(18);

/** For every cell, the 20 other cells sharing its row, column or box. */
export const PEERS: readonly (readonly number[])[] = Array.from({ length: CELLS }, (_, i) => {
  const set = new Set<number>();
  for (const unit of UNITS) if (unit.includes(i)) for (const j of unit) set.add(j);
  set.delete(i);
  return [...set].sort((a, b) => a - b);
});

/** No digit repeated in any row, column or box (empties allowed), all values 0–9. */
export function isValidGrid(grid: Grid): boolean {
  if (grid.length !== CELLS) return false;
  for (const v of grid) if (!Number.isInteger(v) || v < 0 || v > 9) return false;
  for (const unit of UNITS) {
    let seen = 0;
    for (const i of unit) {
      const v = grid[i];
      if (!v) continue;
      if (seen & (1 << v)) return false;
      seen |= 1 << v;
    }
  }
  return true;
}

/** Completely filled and valid. */
export function isSolvedGrid(grid: Grid): boolean {
  return grid.length === CELLS && grid.every((v) => v >= 1 && v <= 9) && isValidGrid(grid);
}
