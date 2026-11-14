import { describe, expect, it } from "vitest";
import { BOXES, CELLS, PEERS, PUZZLE, SOLUTION } from "./puzzle";
import {
  REVEAL_MIN_MS,
  canOfferReveal,
  countPlayerFilled,
  createInitialState,
  deserialize,
  getCompletedBoxes,
  getConflicts,
  getRemaining,
  getWrong,
  isComplete,
  pickHintCell,
  serialize,
  sudokuReducer,
  type SudokuAction,
  type SudokuState,
} from "./engine";

const run = (s: SudokuState, ...actions: SudokuAction[]) => actions.reduce(sudokuReducer, s);
const put = (s: SudokuState, index: number, digit: number) =>
  run(s, { type: "select", index }, { type: "input", digit });
const empties = PUZZLE.flatMap((v, i) => (v ? [] : [i]));
const givenCells = PUZZLE.flatMap((v, i) => (v ? [i] : []));
const wrongDigit = (i: number) => (SOLUTION[i] % 9) + 1;
const solveByHand = (s: SudokuState, skip: number[] = []) =>
  empties.filter((i) => !skip.includes(i)).reduce((acc, i) => put(acc, i, SOLUTION[i]), s);

describe("initial state", () => {
  it("starts from the givens with nothing else", () => {
    const s = createInitialState(1000);
    expect(s.values).toEqual([...PUZZLE]);
    expect(s.notes.every((n) => n === 0)).toBe(true);
    expect(s.selected).toBeNull();
    expect(s.startedAt).toBe(1000);
    expect(isComplete(s)).toBe(false);
    expect(getConflicts(s.values).some(Boolean)).toBe(false);
    expect(getWrong(s).some(Boolean)).toBe(false);
  });
});

describe("(4) givens cannot be modified", () => {
  it("input, erase, notes, hint, undo never change a given", () => {
    let s = createInitialState();
    for (const i of givenCells) {
      const before = s;
      s = run(s, { type: "select", index: i }, { type: "input", digit: wrongDigit(i) }, { type: "erase" });
      s = run(s, { type: "toggleNotes" }, { type: "input", digit: 5 }, { type: "toggleNotes" });
      expect(s.values).toEqual(before.values);
      expect(s.notes).toEqual(before.notes);
      expect(s.history).toHaveLength(0);
      expect(s.mistakes).toBe(0);
    }
    // a hint with a given selected goes elsewhere
    s = run(s, { type: "select", index: givenCells[0] }, { type: "hint", pick: 0 });
    for (const i of givenCells) expect(s.values[i]).toBe(PUZZLE[i]);
  });
  it("givens survive a full game, reveal and reset", () => {
    let s = solveByHand(createInitialState());
    for (const i of givenCells) expect(s.values[i]).toBe(PUZZLE[i]);
    s = run(createInitialState(), { type: "revealAll" }, { type: "reset" });
    expect(s.values).toEqual([...PUZZLE]);
  });
  it("a tampered save cannot overwrite givens", () => {
    const saved = JSON.parse(serialize(createInitialState(5)));
    saved.values[givenCells[0]] = wrongDigit(givenCells[0]);
    const s = deserialize(JSON.stringify(saved));
    expect(s?.values[givenCells[0]]).toBe(PUZZLE[givenCells[0]]);
  });
});

describe("input, erase, selection", () => {
  it("fills the selected cell, counts mistakes, toggles off on the same digit", () => {
    const i = empties[0];
    let s = put(createInitialState(), i, SOLUTION[i]);
    expect(s.values[i]).toBe(SOLUTION[i]);
    expect(s.mistakes).toBe(0);
    s = run(s, { type: "input", digit: SOLUTION[i] });
    expect(s.values[i]).toBe(0);
    s = run(s, { type: "input", digit: wrongDigit(i) });
    expect(s.mistakes).toBe(1);
    expect(getWrong(s)[i]).toBe(true);
    s = run(s, { type: "erase" });
    expect(s.values[i]).toBe(0);
    expect(s.mistakes).toBe(1);
  });
  it("ignores input without a selection and out-of-range values", () => {
    const s0 = createInitialState();
    expect(run(s0, { type: "input", digit: 4 })).toBe(s0);
    expect(run(s0, { type: "select", index: 99 })).toBe(s0);
    const s1 = run(s0, { type: "select", index: empties[0] });
    expect(run(s1, { type: "input", digit: 0 })).toBe(s1);
    expect(run(s1, { type: "input", digit: 10 })).toBe(s1);
    expect(run(s1, { type: "erase" })).toBe(s1);
  });
  it("flags rule conflicts including the given involved", () => {
    // row 1 holds a given 9 at index 2
    const s = put(createInitialState(), 0, 9);
    const conflicts = getConflicts(s.values);
    expect(conflicts[0]).toBe(true);
    expect(conflicts[2]).toBe(true);
    expect(conflicts.filter(Boolean)).toHaveLength(2);
  });
  it("tracks remaining digits", () => {
    const s0 = createInitialState();
    const rem0 = getRemaining(s0.values);
    for (let d = 1; d <= 9; d++) expect(rem0[d]).toBe(9 - PUZZLE.filter((v) => v === d).length);
    const i = empties[0];
    expect(getRemaining(put(s0, i, SOLUTION[i]).values)[SOLUTION[i]]).toBe(rem0[SOLUTION[i]] - 1);
    expect(getRemaining(SOLUTION).slice(1)).toEqual(new Array(9).fill(0));
    expect(getRemaining(new Array(CELLS).fill(7))[7]).toBe(0);
  });
  it("recognises completed boxes only when they are correct", () => {
    let s = createInitialState();
    const box = BOXES[0].filter((i) => !PUZZLE[i]);
    for (const i of box.slice(0, -1)) s = put(s, i, SOLUTION[i]);
    expect(getCompletedBoxes(s)[0]).toBe(false);
    const last = box[box.length - 1];
    expect(getCompletedBoxes(put(s, last, wrongDigit(last)))[0]).toBe(false);
    expect(getCompletedBoxes(put(s, last, SOLUTION[last]))).toEqual([true, ...new Array(8).fill(false)]);
  });
});

describe("notes", () => {
  const i = empties[0];
  it("toggles pencil marks as bitmasks without touching values", () => {
    let s = run(createInitialState(), { type: "select", index: i }, { type: "toggleNotes" });
    expect(s.notesMode).toBe(true);
    s = run(s, { type: "input", digit: 3 }, { type: "input", digit: 7 });
    expect(s.notes[i]).toBe((1 << 3) | (1 << 7));
    expect(s.values[i]).toBe(0);
    expect(s.mistakes).toBe(0);
    s = run(s, { type: "input", digit: 3 });
    expect(s.notes[i]).toBe(1 << 7);
  });
  it("placing a digit clears the cell's notes and that digit from its peers", () => {
    const d = SOLUTION[i];
    const peer = PEERS[i].find((p) => !PUZZLE[p])!;
    const far = empties.find((e) => e !== i && !PEERS[i].includes(e))!;
    let s = run(createInitialState(), { type: "toggleNotes" });
    s = run(s, { type: "select", index: i }, { type: "input", digit: 1 });
    s = run(s, { type: "select", index: peer }, { type: "input", digit: d }, { type: "input", digit: d === 1 ? 2 : 1 });
    s = run(s, { type: "select", index: far }, { type: "input", digit: d });
    s = run(s, { type: "toggleNotes" }, { type: "select", index: i }, { type: "input", digit: d });
    expect(s.notes[i]).toBe(0);
    expect(s.notes[peer]).toBe(1 << (d === 1 ? 2 : 1));
    expect(s.notes[far]).toBe(1 << d);
    // one undo restores the value AND the swept notes
    s = run(s, { type: "undo" });
    expect(s.values[i]).toBe(0);
    expect(s.notes[i]).toBe(1 << 1);
    expect(s.notes[peer] & (1 << d)).toBeTruthy();
  });
  it("does not pencil into a filled cell", () => {
    let s = put(createInitialState(), i, SOLUTION[i]);
    const before = s;
    s = run(s, { type: "toggleNotes" }, { type: "input", digit: 2 });
    expect(s.values).toEqual(before.values);
    expect(s.notes[i]).toBe(0);
  });
});

describe("undo", () => {
  it("walks back through values, erases and notes in order", () => {
    const [a, b] = empties;
    const s0 = createInitialState();
    let s = put(s0, a, SOLUTION[a]);
    s = put(s, b, wrongDigit(b));
    s = run(s, { type: "erase" });
    s = run(s, { type: "toggleNotes" }, { type: "input", digit: 4 }, { type: "toggleNotes" });
    expect(s.history).toHaveLength(4);
    s = run(s, { type: "undo" });
    expect(s.notes[b]).toBe(0);
    s = run(s, { type: "undo" });
    expect(s.values[b]).toBe(wrongDigit(b));
    s = run(s, { type: "undo" });
    expect(s.values[b]).toBe(0);
    expect(s.selected).toBe(b);
    s = run(s, { type: "undo" });
    expect(s.values).toEqual(s0.values);
    expect(s.history).toHaveLength(0);
    expect(run(s, { type: "undo" })).toBe(s);
  });
  it("never rewrites a hinted cell", () => {
    const a = empties[0];
    let s = put(createInitialState(), a, wrongDigit(a));
    s = run(s, { type: "hint" });
    expect(s.values[a]).toBe(SOLUTION[a]);
    s = run(s, { type: "undo" });
    expect(s.values[a]).toBe(SOLUTION[a]);
  });
});

describe("(5) completion is recognised", () => {
  it("only when the last cell is filled correctly", () => {
    const last = empties[empties.length - 1];
    let s = solveByHand(createInitialState(), [last]);
    expect(isComplete(s)).toBe(false);
    s = put(s, last, SOLUTION[last]);
    expect(isComplete(s)).toBe(true);
    expect(s.values).toEqual([...SOLUTION]);
    expect(s.assisted).toBe(false);
    expect(getCompletedBoxes(s).every(Boolean)).toBe(true);
    expect(getRemaining(s.values).every((n) => n === 0)).toBe(true);
  });
  it("locks the board afterwards", () => {
    const done = solveByHand(createInitialState());
    const i = empties[0];
    const after = run(
      done,
      { type: "select", index: i },
      { type: "input", digit: wrongDigit(i) },
      { type: "erase" },
      { type: "undo" },
      { type: "hint" },
      { type: "toggleNotes" },
      { type: "revealAll" },
    );
    expect(after.values).toEqual([...SOLUTION]);
    expect(after.assisted).toBe(false);
    expect(after.hints).toBe(0);
    expect(isComplete(after)).toBe(true);
  });
});

describe("(6) invalid or incorrect full boards do not complete", () => {
  const last = empties[empties.length - 1];
  it("a full board with one wrong digit is not complete", () => {
    const s = put(solveByHand(createInitialState(), [last]), last, wrongDigit(last));
    expect(s.values.every(Boolean)).toBe(true);
    expect(isComplete(s)).toBe(false);
    expect(getWrong(s)[last]).toBe(true);
    expect(getConflicts(s.values)[last]).toBe(true);
    // …and fixing it completes
    expect(isComplete(put(s, last, SOLUTION[last]))).toBe(true);
  });
  it("a full board of rule-breaking digits is not complete", () => {
    const s = empties.reduce((acc, i) => put(acc, i, 1), createInitialState());
    expect(s.values.every(Boolean)).toBe(true);
    expect(isComplete(s)).toBe(false);
  });
  it("a valid-looking but different full grid is not complete", () => {
    const shifted = SOLUTION.map((v) => (v % 9) + 1); // a valid sudoku, but not this puzzle's
    expect(isComplete({ values: shifted, solution: SOLUTION })).toBe(false);
    expect(isComplete({ values: PUZZLE, solution: SOLUTION })).toBe(false);
  });
});

describe("(7) hints and assisted completion", () => {
  it("a hint fills the selected empty cell correctly and locks it", () => {
    const i = empties[3];
    let s = run(createInitialState(), { type: "select", index: i }, { type: "hint", pick: 0.9 });
    expect(s.values[i]).toBe(SOLUTION[i]);
    expect(s.hints).toBe(1);
    expect(s.locked[i]).toBe(true);
    expect(s.mistakes).toBe(0);
    s = run(s, { type: "input", digit: wrongDigit(i) }, { type: "erase" });
    expect(s.values[i]).toBe(SOLUTION[i]);
    expect(countPlayerFilled(s)).toBe(0);
  });
  it("a hint corrects a wrong selected cell", () => {
    const i = empties[0];
    const s = run(put(createInitialState(), i, wrongDigit(i)), { type: "hint" });
    expect(s.values[i]).toBe(SOLUTION[i]);
    expect(getWrong(s).some(Boolean)).toBe(false);
  });
  it("without a usable selection a hint picks an open cell deterministically from `pick`", () => {
    const s0 = createInitialState();
    expect(pickHintCell(s0, 0)).toBe(empties[0]);
    expect(pickHintCell(s0, 0.999999)).toBe(empties[empties.length - 1]);
    expect(pickHintCell(s0, 7)).toBe(empties[empties.length - 1]);
    const s = run(s0, { type: "hint", pick: 0.5 });
    const filled = s.values.findIndex((v, i) => v !== s0.values[i]);
    expect(empties).toContain(filled);
    expect(s.values[filled]).toBe(SOLUTION[filled]);
    expect(s.selected).toBe(filled);
  });
  it("a hint clears the digit from peers' notes", () => {
    const i = empties[0];
    const peer = PEERS[i].find((p) => !PUZZLE[p])!;
    let s = run(createInitialState(), { type: "toggleNotes" }, { type: "select", index: peer }, { type: "input", digit: SOLUTION[i] });
    s = run(s, { type: "select", index: i }, { type: "hint" });
    expect(s.notes[peer]).toBe(0);
  });
  it("hints alone can finish the board, and that is not 'assisted'", () => {
    let s = createInitialState();
    for (let n = 0; n < empties.length; n++) s = run(s, { type: "hint", pick: 0.37 });
    expect(isComplete(s)).toBe(true);
    expect(s.hints).toBe(empties.length);
    expect(s.assisted).toBe(false);
    expect(run(s, { type: "hint" })).toBe(s);
  });
  it("revealAll completes from any position, fixes wrong digits and marks assisted", () => {
    const [a, b] = empties;
    let s = put(put(createInitialState(), a, wrongDigit(a)), b, SOLUTION[b]);
    s = run(s, { type: "toggleNotes" }, { type: "select", index: empties[5] }, { type: "input", digit: 2 });
    s = run(s, { type: "revealAll" });
    expect(s.values).toEqual([...SOLUTION]);
    expect(isComplete(s)).toBe(true);
    expect(s.assisted).toBe(true);
    expect(s.notes.every((n) => n === 0)).toBe(true);
    expect(s.notesMode).toBe(false);
  });
  it("fillSolution (test bypass) completes as a normal, unassisted solve", () => {
    const s = run(createInitialState(), { type: "fillSolution" });
    expect(isComplete(s)).toBe(true);
    expect(s.assisted).toBe(false);
  });
  it("the reveal is only offered after a genuine attempt", () => {
    const t0 = 1_000_000;
    let s = createInitialState(t0);
    expect(canOfferReveal(s, t0 + 1000)).toBe(false);
    expect(canOfferReveal(s, t0 + REVEAL_MIN_MS)).toBe(true);
    for (const i of empties.slice(0, 7)) s = put(s, i, SOLUTION[i]);
    expect(canOfferReveal(s, t0)).toBe(false);
    expect(canOfferReveal(put(s, empties[7], wrongDigit(empties[7])), t0)).toBe(true);
    let h = createInitialState(t0);
    h = run(h, { type: "hint" }, { type: "hint" });
    expect(canOfferReveal(h, t0)).toBe(false);
    expect(canOfferReveal(run(h, { type: "hint" }), t0)).toBe(true);
    expect(canOfferReveal(run(h, { type: "revealAll" }), t0 + REVEAL_MIN_MS)).toBe(false);
  });
});

describe("persistence", () => {
  it("round-trips a game in progress", () => {
    const [a, b, c] = empties;
    let s = put(createInitialState(42), a, SOLUTION[a]);
    s = put(s, b, wrongDigit(b));
    s = run(s, { type: "select", index: c }, { type: "hint" });
    s = run(s, { type: "toggleNotes" }, { type: "select", index: empties[9] }, { type: "input", digit: 6 }, { type: "markWarned" });
    const back = deserialize(serialize(s), createInitialState(999));
    expect(back).toEqual(s);
    // undo still works after a restore
    expect(run(back!, { type: "undo" }).notes[empties[9]]).toBe(0);
  });
  it("rejects garbage, other versions and other puzzles", () => {
    expect(deserialize(null)).toBeNull();
    expect(deserialize("")).toBeNull();
    expect(deserialize("{nope")).toBeNull();
    expect(deserialize("42")).toBeNull();
    const ok = JSON.parse(serialize(createInitialState(1)));
    expect(deserialize(JSON.stringify({ ...ok, v: 0 }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...ok, puzzleId: "other" }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...ok, values: [1, 2, 3] }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...ok, values: ok.values.map(() => 12) }))).toBeNull();
    expect(deserialize(JSON.stringify({ ...ok, notes: "x" }))).toBeNull();
    const odd = deserialize(JSON.stringify({ ...ok, history: [[["a"]], 5], selected: 400, hints: -2 }));
    expect(odd?.history).toEqual([]);
    expect(odd?.selected).toBeNull();
    expect(odd?.hints).toBe(0);
  });
  it("caps the stored history", () => {
    let s = run(createInitialState(), { type: "select", index: empties[0] }, { type: "toggleNotes" });
    for (let n = 0; n < 300; n++) s = run(s, { type: "input", digit: (n % 9) + 1 });
    expect(s.history.length).toBeLessThanOrEqual(120);
    expect(JSON.parse(serialize(s)).history.length).toBeLessThanOrEqual(40);
  });
  it("reset returns a fresh board", () => {
    const s = run(put(createInitialState(1), empties[0], 5), { type: "hint" }, { type: "reset", now: 77 });
    expect(s).toEqual(createInitialState(77));
    expect(CELLS).toBe(81);
  });
});
