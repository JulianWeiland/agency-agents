import { describe, expect, it } from "vitest";
import { BOXES, CELLS, PEERS, PUZZLE, SOLUTION, UNITS, isSolvedGrid, isValidGrid, parseGrid } from "./puzzle";
import { countSolutions, hasUniqueSolution, solve } from "./solver";

describe("geometry", () => {
  it("has 27 units of 9 distinct cells and 20 peers per cell", () => {
    expect(UNITS).toHaveLength(27);
    for (const u of UNITS) expect(new Set(u).size).toBe(9);
    expect(BOXES).toHaveLength(9);
    expect(new Set(BOXES.flat()).size).toBe(CELLS);
    for (let i = 0; i < CELLS; i++) {
      expect(PEERS[i]).toHaveLength(20);
      expect(PEERS[i]).not.toContain(i);
    }
  });
});

describe("(1) the starting puzzle is valid", () => {
  it("has 81 cells with digits 0–9 and no duplicate in any row, column or box", () => {
    expect(PUZZLE).toHaveLength(CELLS);
    expect(isValidGrid(PUZZLE)).toBe(true);
  });
  it("is a medium puzzle: 30–34 givens, every digit present", () => {
    const givens = PUZZLE.filter(Boolean).length;
    expect(givens).toBeGreaterThanOrEqual(30);
    expect(givens).toBeLessThanOrEqual(34);
    for (let d = 1; d <= 9; d++) expect(PUZZLE).toContain(d);
  });
  it("is rotationally symmetric", () => {
    for (let i = 0; i < CELLS; i++) expect(PUZZLE[i] !== 0).toBe(PUZZLE[80 - i] !== 0);
  });
});

describe("(2) the puzzle has exactly one solution", () => {
  it("the solver counts exactly 1 (cap 2)", () => {
    expect(countSolutions(PUZZLE, 2)).toBe(1);
    expect(hasUniqueSolution(PUZZLE)).toBe(true);
  });
  it("the counter really detects multiple / zero solutions", () => {
    expect(countSolutions(new Array<number>(CELLS).fill(0), 2)).toBe(2);
    // removing every 8 and 9 from the solution leaves at least two completions (swap 8↔9)
    const loose = SOLUTION.map((v) => (v >= 8 ? 0 : v));
    expect(countSolutions(loose, 2)).toBe(2);
    expect(countSolutions(loose, 5)).toBeGreaterThanOrEqual(2);
    const broken = [...PUZZLE];
    broken[0] = 9; // row 1 already holds a 9
    expect(countSolutions(broken)).toBe(0);
    expect(solve(broken)).toBeNull();
    // valid by the rules but unsolvable: R1C1 must be 8
    const dead = [...PUZZLE];
    dead[0] = 4;
    expect(isValidGrid(dead)).toBe(true);
    expect(countSolutions(dead)).toBe(0);
  });
});

describe("(3) the intended solution is valid and matches the solver", () => {
  it("is a complete, valid grid", () => {
    expect(isSolvedGrid(SOLUTION)).toBe(true);
    for (const u of UNITS) expect([...u.map((i) => SOLUTION[i])].sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
  it("agrees with every given", () => {
    for (let i = 0; i < CELLS; i++) if (PUZZLE[i]) expect(SOLUTION[i]).toBe(PUZZLE[i]);
  });
  it("equals what the solver finds", () => {
    expect(solve(PUZZLE)).toEqual([...SOLUTION]);
  });
});

describe("grid helpers", () => {
  it("parseGrid reads dots as empty and rejects wrong sizes", () => {
    expect(parseGrid("1.3" + ".".repeat(78)).slice(0, 3)).toEqual([1, 0, 3]);
    expect(() => parseGrid("123")).toThrow();
  });
  it("isSolvedGrid rejects incomplete and invalid boards", () => {
    expect(isSolvedGrid(PUZZLE)).toBe(false);
    const bad = [...SOLUTION];
    [bad[0], bad[1]] = [bad[1], bad[0]];
    expect(isSolvedGrid(bad)).toBe(false);
  });
});
