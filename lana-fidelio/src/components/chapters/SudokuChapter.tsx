"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { useExperience } from "@/lib/store";
import { story } from "@/lib/story";
import { chime, error as errorSound, shimmer, success, tap } from "@/lib/audio";
import { Backdrop, Button, Particles, Sheet, Toast } from "@/components/ui";
import { CELLS, colOf, rowOf } from "@/lib/sudoku/puzzle";
import {
  canOfferReveal,
  createInitialState,
  getCompletedBoxes,
  getConflicts,
  getRemaining,
  getWrong,
  isComplete,
  isEditable,
  loadSudoku,
  saveSudoku,
  sudokuReducer,
  type SudokuAction,
  type SudokuState,
} from "@/lib/sudoku/engine";
import { Board } from "@/components/sudoku/Board";
import { Pad } from "@/components/sudoku/Pad";
import { Toolbar } from "@/components/sudoku/Toolbar";
import { QueenRule } from "@/components/sudoku/Ornaments";
import { SUDOKU_CSS } from "@/components/sudoku/styles";

/** microcopy that is not in story.ts */
const PLAY_AGAIN = "Play again";

const MISTAKES_BEFORE_WHISPER = 3;
const BYPASS_DELAY = 600;
const CASCADE_MS = 1300;
const PULSE_MS = 1750;

function freshGame(now: number): SudokuState {
  const s = createInitialState(now);
  // start with the first open cell selected so the very first tap on the pad already does something
  return { ...s, selected: s.values.findIndex((v) => v === 0) };
}

function bootGame(alreadySolved: boolean): SudokuState {
  const now = Date.now();
  const saved = loadSudoku(now) ?? freshGame(now);
  // replaying a solved chapter always shows the finished board
  return alreadySolved && !isComplete(saved) ? sudokuReducer(saved, { type: "fillSolution" }) : saved;
}

export default function SudokuChapter() {
  const exp = useExperience();
  const { bypassSudoku } = exp;

  /** the chapter was opened with the puzzle already solved (Relive the Story) */
  const [replay, setReplay] = useState(exp.sudokuSolved);
  const [game, setGame] = useState<SudokuState>(() => bootGame(exp.sudokuSolved));
  const [pulsing, setPulsing] = useState(false);
  const [cascade, setCascade] = useState<ReadonlySet<number> | null>(null);
  const [flash, setFlash] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const complete = isComplete(game);
  const locked = complete || replay || pulsing;
  const cascading = cascade !== null;

  const conflicts = useMemo(() => getConflicts(game.values), [game.values]);
  const wrong = useMemo(() => getWrong(game), [game]);
  const remaining = useMemo(() => getRemaining(game.values), [game.values]);
  const offerReveal = !locked && canOfferReveal(game, now);

  // always-current handles for timers and global listeners
  const live = useRef({ exp, game });
  useEffect(() => {
    live.current = { exp, game };
  });

  /* autosave on every change */
  useEffect(() => {
    saveSudoku(game);
  }, [game]);

  /* the reveal offer also unlocks with time on the board */
  useEffect(() => {
    if (locked) return;
    const id = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(id);
  }, [locked]);

  /** fill everything that is still open; the new digits cascade in diagonally */
  const fillAll = useCallback((type: "fillSolution" | "revealAll") => {
    const prev = live.current.game;
    const next = sudokuReducer(prev, { type });
    if (next === prev) return;
    const filled = new Set<number>();
    for (let i = 0; i < CELLS; i++) if (next.values[i] !== prev.values[i]) filled.add(i);
    setCascade(filled);
    setGame(next);
    shimmer();
  }, []);

  /* test bypass (?sudoku=solved): the board solves itself shortly after it appears */
  useEffect(() => {
    if (!bypassSudoku || replay || complete) return;
    const id = window.setTimeout(() => fillAll("fillSolution"), BYPASS_DELAY);
    return () => window.clearTimeout(id);
  }, [bypassSudoku, replay, complete, fillAll]);

  /* completion — real, assisted or bypassed: golden pulse, tell the store, move on */
  const assisted = game.assisted;
  useEffect(() => {
    if (!complete || replay) return;
    const wait = cascading ? CASCADE_MS : 240;
    const t1 = window.setTimeout(() => {
      setPulsing(true);
      success();
      live.current.exp.completeSudoku({ assisted });
    }, wait);
    const t2 = window.setTimeout(() => live.current.exp.next(), wait + PULSE_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [complete, replay, cascading, assisted]);

  /** every player action goes through here */
  const act = useCallback(
    (action: SudokuAction) => {
      if (locked) return;
      const prev = game;
      let next = sudokuReducer(prev, action);
      if (next === prev) return;

      if (action.type === "input" && !prev.notesMode) {
        if (next.mistakes > prev.mistakes) {
          errorSound();
          if (next.mistakes >= MISTAKES_BEFORE_WHISPER && !next.warned) {
            next = sudokuReducer(next, { type: "markWarned" });
            setToast(story.sudoku.toastMistakes);
          }
        } else {
          tap();
          const before = getCompletedBoxes(prev).filter(Boolean).length;
          const after = getCompletedBoxes(next).filter(Boolean).length;
          if (after > before && !isComplete(next)) {
            chime();
            setToast(story.sudoku.toastBox);
          }
        }
      } else if (action.type === "hint") {
        shimmer();
        setFlash(next.selected);
      } else {
        tap();
      }
      if (action.type !== "select" && action.type !== "hint") setFlash(null);
      setGame(next);
    },
    [game, locked],
  );

  /* hardware keyboard (desktop preview): digits, arrows, backspace, N for notes, ⌘/Ctrl+Z */
  const actRef = useRef(act);
  useEffect(() => {
    actRef.current = act;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"]')) return;
      const { game: g } = live.current;
      const run = actRef.current;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        run({ type: "undo" });
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key >= "1" && e.key <= "9") {
        run({ type: "input", digit: Number(e.key) });
      } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        run({ type: "erase" });
      } else if (e.key.toLowerCase() === "n") {
        run({ type: "toggleNotes" });
      } else if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const cur = g.selected ?? 0;
        let r = rowOf(cur);
        let c = colOf(cur);
        if (e.key === "ArrowUp") r = (r + 8) % 9;
        if (e.key === "ArrowDown") r = (r + 1) % 9;
        if (e.key === "ArrowLeft") c = (c + 8) % 9;
        if (e.key === "ArrowRight") c = (c + 1) % 9;
        run({ type: "select", index: g.selected === null ? 0 : r * 9 + c });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const playAgain = () => {
    exp.resetPuzzle(); // clears the save + sudokuSolved
    setCascade(null);
    setFlash(null);
    setPulsing(false);
    setReplay(false);
    setNow(Date.now());
    setGame(freshGame(Date.now()));
  };

  const sel = game.selected;
  const canErase = sel !== null && isEditable(game, sel) && (game.values[sel] !== 0 || game.notes[sel] !== 0);
  const selectedNotes = sel !== null && game.values[sel] === 0 ? game.notes[sel] : 0;
  const phase = replay ? "solved" : pulsing ? "pulse" : "play";
  const finishing = complete && !replay;

  return (
    <section className="chapter sdk-root" data-sudoku-phase={phase} data-sudoku-complete={complete ? "" : undefined}>
      <style href="lana-sudoku" precedence="medium">
        {SUDOKU_CSS}
      </style>
      <Backdrop fallbackClassName="bg-royal" />
      <Particles variant="sparkle" count={10} intensity={0.6} />

      <header className="sdk-header relative z-10">
        <QueenRule className="sdk-tall-only mb-3" />
        <h1 className="sdk-title">{story.sudoku.header}</h1>
        <p className="sdk-sub">{story.sudoku.sub}</p>
      </header>

      <div className="sdk-fit relative z-10">
        <Board
          state={game}
          conflicts={conflicts}
          wrong={wrong}
          phase={phase}
          cascade={cascade}
          flash={flash}
          onSelect={(index) => act({ type: "select", index })}
        />
      </div>

      {replay ? (
        <div className="sdk-solved sdk-rise relative z-10">
          <QueenRule />
          <p className="sdk-complete">{story.sudoku.complete}</p>
          <Button variant="ruby" full onClick={() => exp.next()}>
            {story.decree.continueCta}
          </Button>
          <button type="button" className="sdk-link" onClick={playAgain}>
            {PLAY_AGAIN}
          </button>
        </div>
      ) : (
        <>
          <div className="sdk-controls relative z-10">
            <Toolbar
              notesMode={game.notesMode}
              canUndo={game.history.length > 0}
              canErase={canErase}
              hints={game.hints}
              disabled={locked}
              onUndo={() => act({ type: "undo" })}
              onErase={() => act({ type: "erase" })}
              onToggleNotes={() => act({ type: "toggleNotes" })}
              onHint={() => act({ type: "hint", pick: Math.random() })}
            />
            <Pad
              remaining={remaining}
              notesMode={game.notesMode}
              selectedNotes={selectedNotes}
              disabled={locked}
              onDigit={(digit) => act({ type: "input", digit })}
            />
          </div>

          <div className="sdk-foot relative z-10" aria-live="polite">
            {finishing ? (
              pulsing && <p className="sdk-complete sdk-rise">{story.sudoku.complete}</p>
            ) : offerReveal ? (
              <button type="button" className="sdk-reveal sdk-rise" onClick={() => setSheetOpen(true)}>
                <Sparkles size={13} strokeWidth={1.6} aria-hidden />
                <span>{story.sudoku.revealCta}</span>
              </button>
            ) : (
              <QueenRule />
            )}
          </div>
        </>
      )}

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={story.sudoku.revealSheet.title}
        description={story.sudoku.revealSheet.body}
      >
        <Button
          variant="ruby"
          full
          onClick={() => {
            setSheetOpen(false);
            fillAll("revealAll");
          }}
        >
          {story.sudoku.revealSheet.confirm}
        </Button>
        <Button variant="ghost" full size="sm" onClick={() => setSheetOpen(false)}>
          {story.sudoku.revealSheet.cancel}
        </Button>
      </Sheet>

      <Toast message={toast} onClear={() => setToast(null)} />
    </section>
  );
}
