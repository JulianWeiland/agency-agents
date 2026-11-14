import { CELLS, PEERS, isValidGrid, type Grid } from "./puzzle";

const ALL = 0x3fe; // bits 1..9

function candidates(grid: number[], i: number): number {
  let mask = ALL;
  for (const p of PEERS[i]) mask &= ~(1 << grid[p]);
  return mask;
}

function bitCount(mask: number): number {
  let n = 0;
  for (let m = mask; m; m &= m - 1) n++;
  return n;
}

/**
 * Backtracking search (most-constrained cell first).
 * Calls `onSolution` for every solution found; stops as soon as it returns true.
 */
function search(grid: number[], onSolution: (g: number[]) => boolean): boolean {
  let best = -1;
  let bestMask = 0;
  let bestCount = 10;
  for (let i = 0; i < CELLS; i++) {
    if (grid[i]) continue;
    const mask = candidates(grid, i);
    const n = bitCount(mask);
    if (n === 0) return false; // dead end
    if (n < bestCount) {
      best = i;
      bestMask = mask;
      bestCount = n;
      if (n === 1) break;
    }
  }
  if (best < 0) return onSolution(grid);
  for (let d = 1; d <= 9; d++) {
    if (!(bestMask & (1 << d))) continue;
    grid[best] = d;
    const stop = search(grid, onSolution);
    grid[best] = 0;
    if (stop) return true;
  }
  return false;
}

/**
 * Number of distinct solutions, capped (default 2): 0 = unsolvable, 1 = unique, 2 = "more than one".
 */
export function countSolutions(grid: Grid, cap = 2): number {
  if (!isValidGrid(grid)) return 0;
  let count = 0;
  search([...grid], () => ++count >= cap);
  return count;
}

/** First solution found, or null when the grid is invalid / unsolvable. */
export function solve(grid: Grid): number[] | null {
  if (!isValidGrid(grid)) return null;
  let found: number[] | null = null;
  search([...grid], (g) => {
    found = [...g];
    return true;
  });
  return found;
}

export function hasUniqueSolution(grid: Grid): boolean {
  return countSolutions(grid, 2) === 1;
}
