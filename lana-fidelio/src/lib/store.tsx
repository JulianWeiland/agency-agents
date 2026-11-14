"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { setAudioEnabled } from "./audio";

/* ───────────────────────────── types (SPEC · Store API) ───────────────────────────── */

export type ChapterId =
  | "portal"
  | "fidelio"
  | "cosmic"
  | "sudoku"
  | "dates"
  | "gift"
  | "kingdoms"
  | "decree"
  | "finale";
export type Kingdom = "sea" | "balance";

export interface ExperienceState {
  /** false until localStorage is read (render a neutral dark screen until true) */
  hydrated: boolean;
  chapter: ChapterId;
  passwordAccepted: boolean;
  /** true after real solve, assisted solve, or bypass */
  sudokuSolved: boolean;
  sudokuAssisted: boolean;
  giftOpened: boolean;
  /** currently selected/confirmed kingdom */
  choice: Kingdom | null;
  choiceConfirmed: boolean;
  /** server POST succeeded */
  choiceSynced: boolean;
  /** reached finale at least once → free navigation */
  completed: boolean;
  /** random opaque id */
  experienceId: string;
  soundOn: boolean;
  /** from ?sudoku=solved (not persisted as solved until the chapter completes) */
  bypassSudoku: boolean;
}

export interface ExperienceActions {
  /** guarded: dates/gift/kingdoms need sudokuSolved; decree/finale need choiceConfirmed (unless completed) */
  go(chapter: ChapterId): void;
  /** advance to the following chapter in order (same guards) */
  next(): void;
  acceptPassword(): void;
  /** sets sudokuSolved, does NOT navigate */
  completeSudoku(opts?: { assisted?: boolean }): void;
  openGift(): void;
  selectKingdom(k: Kingdom | null): void;
  /** sets choice + confirmed, POSTs best-effort, sets choiceSynced */
  confirmKingdom(k: Kingdom): Promise<void>;
  setSound(on: boolean): void;
  /** clears sudoku save + sudokuSolved only */
  resetPuzzle(): void;
  resetAll(): void;
}

/* ───────────────────────────── constants ───────────────────────────── */

export const CHAPTER_ORDER: readonly ChapterId[] = [
  "portal",
  "fidelio",
  "cosmic",
  "sudoku",
  "dates",
  "gift",
  "kingdoms",
  "decree",
  "finale",
];

export const STORAGE_KEY = "lana.fidelio.v1";
/** Board save — owned by the sudoku module; the store only ever removes it (resetPuzzle/resetAll). */
export const SUDOKU_STORAGE_KEY = "lana.fidelio.sudoku.v1";

export function isChapterId(v: unknown): v is ChapterId {
  return typeof v === "string" && (CHAPTER_ORDER as readonly string[]).includes(v);
}
export function isKingdom(v: unknown): v is Kingdom {
  return v === "sea" || v === "balance";
}

/* ───────────────────────────── helpers ───────────────────────────── */

function makeId(): string {
  try {
    if (typeof crypto !== "undefined") {
      if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
      if (typeof crypto.getRandomValues === "function") {
        const b = crypto.getRandomValues(new Uint8Array(16));
        return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
      }
    }
  } catch {
    /* fall through */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function initialState(): ExperienceState {
  return {
    hydrated: false,
    chapter: "portal",
    passwordAccepted: false,
    sudokuSolved: false,
    sudokuAssisted: false,
    giftOpened: false,
    choice: null,
    choiceConfirmed: false,
    choiceSynced: false,
    completed: false,
    experienceId: "",
    soundOn: false,
    bypassSudoku: false,
  };
}

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode / quota — the experience still works in memory */
  }
}
function safeRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Read + sanitise the persisted experience. Never throws. */
function loadPersisted(): ExperienceState {
  const base = initialState();
  const raw = typeof window === "undefined" ? null : safeGet(STORAGE_KEY);
  if (raw) {
    try {
      const p = JSON.parse(raw) as Record<string, unknown>;
      if (p && typeof p === "object") {
        if (isChapterId(p.chapter)) base.chapter = p.chapter;
        base.passwordAccepted = p.passwordAccepted === true;
        base.sudokuSolved = p.sudokuSolved === true;
        base.sudokuAssisted = p.sudokuAssisted === true;
        base.giftOpened = p.giftOpened === true;
        base.choice = isKingdom(p.choice) ? p.choice : null;
        base.choiceConfirmed = p.choiceConfirmed === true && base.choice !== null;
        base.choiceSynced = p.choiceSynced === true && base.choiceConfirmed;
        base.completed = p.completed === true;
        base.soundOn = p.soundOn === true;
        base.bypassSudoku = p.bypassSudoku === true;
        if (typeof p.experienceId === "string" && p.experienceId.length >= 8) {
          base.experienceId = p.experienceId.slice(0, 64);
        }
      }
    } catch {
      /* corrupted save → start fresh */
    }
  }
  if (!base.experienceId) base.experienceId = makeId();
  // Never restore into a chapter whose prerequisites are missing (no dead ends).
  if (!canEnter(base, base.chapter)) base.chapter = fallbackChapter(base);
  return base;
}

function persist(s: ExperienceState): void {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hydrated, ...rest } = s;
  safeSet(STORAGE_KEY, JSON.stringify(rest));
}

/** The navigation guard from the SPEC. */
export function canEnter(s: ExperienceState, chapter: ChapterId): boolean {
  if (s.completed) return true;
  switch (chapter) {
    case "dates":
    case "gift":
    case "kingdoms":
      return s.sudokuSolved;
    case "decree":
    case "finale":
      return s.choiceConfirmed;
    default:
      return true;
  }
}

function fallbackChapter(s: ExperienceState): ChapterId {
  if (!s.sudokuSolved) return s.passwordAccepted ? "sudoku" : "portal";
  return "kingdoms";
}

/**
 * Returns a copy of `s` placed at `chapter` with every prerequisite flag it needs
 * (used for the ?chapter=<id> testing jump).
 */
export function withPrerequisites(s: ExperienceState, chapter: ChapterId): ExperienceState {
  const i = CHAPTER_ORDER.indexOf(chapter);
  const n: ExperienceState = { ...s, chapter };
  if (i >= CHAPTER_ORDER.indexOf("cosmic")) n.passwordAccepted = true;
  if (i >= CHAPTER_ORDER.indexOf("dates")) n.sudokuSolved = true;
  if (i >= CHAPTER_ORDER.indexOf("kingdoms")) n.giftOpened = true;
  if (i >= CHAPTER_ORDER.indexOf("decree")) {
    n.choice = n.choice ?? "sea";
    n.choiceConfirmed = true;
  }
  if (chapter === "finale") n.completed = true;
  return n;
}

/* ───────────────────────────── reducer ───────────────────────────── */

type Action =
  | { type: "hydrate"; state: ExperienceState }
  | { type: "go"; chapter: ChapterId }
  | { type: "next" }
  | { type: "acceptPassword" }
  | { type: "completeSudoku"; assisted: boolean }
  | { type: "openGift" }
  | { type: "selectKingdom"; kingdom: Kingdom | null }
  | { type: "confirmKingdom"; kingdom: Kingdom }
  | { type: "synced"; kingdom: Kingdom }
  | { type: "setSound"; on: boolean }
  | { type: "resetPuzzle" }
  | { type: "resetAll"; id: string };

function enter(s: ExperienceState, chapter: ChapterId): ExperienceState {
  if (chapter === s.chapter) return s;
  if (!canEnter(s, chapter)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[experience] go('${chapter}') blocked — prerequisites missing`);
    }
    return s;
  }
  return { ...s, chapter, completed: s.completed || chapter === "finale" };
}

function reducer(s: ExperienceState, a: Action): ExperienceState {
  switch (a.type) {
    case "hydrate":
      return { ...a.state, hydrated: true };
    case "go":
      return enter(s, a.chapter);
    case "next": {
      const i = CHAPTER_ORDER.indexOf(s.chapter);
      const target = CHAPTER_ORDER[i + 1];
      return target ? enter(s, target) : s;
    }
    case "acceptPassword":
      return s.passwordAccepted ? s : { ...s, passwordAccepted: true };
    case "completeSudoku":
      return {
        ...s,
        sudokuSolved: true,
        sudokuAssisted: s.sudokuAssisted || a.assisted,
        bypassSudoku: false,
      };
    case "openGift":
      return s.giftOpened ? s : { ...s, giftOpened: true };
    case "selectKingdom":
      // changing the selection after a confirmation un-confirms nothing: the confirmed choice
      // only changes through confirmKingdom()
      if (s.choiceConfirmed) return s;
      return s.choice === a.kingdom ? s : { ...s, choice: a.kingdom };
    case "confirmKingdom":
      return {
        ...s,
        choice: a.kingdom,
        choiceConfirmed: true,
        choiceSynced: s.choiceSynced && s.choice === a.kingdom,
      };
    case "synced":
      return s.choice === a.kingdom && s.choiceConfirmed ? { ...s, choiceSynced: true } : s;
    case "setSound":
      return s.soundOn === a.on ? s : { ...s, soundOn: a.on };
    case "resetPuzzle":
      return { ...s, sudokuSolved: false, sudokuAssisted: false, bypassSudoku: false };
    case "resetAll":
      return { ...initialState(), hydrated: true, experienceId: a.id };
    default:
      return s;
  }
}

/* ───────────────────────────── network ───────────────────────────── */

async function postChoice(id: string, choice: Kingdom): Promise<boolean> {
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = setTimeout(() => ctrl?.abort(), 6000);
  try {
    const res = await fetch("/api/choice", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, choice }),
      signal: ctrl?.signal,
      cache: "no-store",
      keepalive: true,
    });
    if (!res.ok) return false;
    const json: unknown = await res.json().catch(() => null);
    return !!json && typeof json === "object" && (json as { stored?: unknown }).stored === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/* ───────────────────────────── provider ───────────────────────────── */

const Ctx = createContext<(ExperienceState & ExperienceActions) | null>(null);

export interface ExperienceProviderProps {
  children: ReactNode;
  /**
   * Runs once, on the client, on the state just read from localStorage — before the first
   * hydrated render. Experience.tsx uses it for the query params (?reset, ?sudoku, ?chapter).
   */
  bootstrap?: (loaded: ExperienceState, tools: BootstrapTools) => ExperienceState;
}

export interface BootstrapTools {
  /** a brand-new state (new experienceId); also wipes both localStorage keys */
  fresh(): ExperienceState;
  withPrerequisites: typeof withPrerequisites;
}

export function ExperienceProvider({ children, bootstrap }: ExperienceProviderProps) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const stateRef = useRef(state);
  const bootstrapRef = useRef(bootstrap);
  const booted = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Hydrate once from localStorage (client only → no SSR mismatch).
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    let loaded = loadPersisted();
    const fn = bootstrapRef.current;
    if (fn) {
      try {
        loaded = fn(loaded, {
          fresh: () => {
            safeRemove(STORAGE_KEY);
            safeRemove(SUDOKU_STORAGE_KEY);
            return { ...initialState(), experienceId: makeId() };
          },
          withPrerequisites,
        });
      } catch {
        /* a bad query param must never break the gift */
      }
    }
    setAudioEnabled(loaded.soundOn);
    dispatch({ type: "hydrate", state: loaded });
  }, []);

  // Persist every change after hydration.
  useEffect(() => {
    if (state.hydrated) persist(state);
  }, [state]);

  const actions = useMemo<ExperienceActions>(
    () => ({
      go: (chapter) => dispatch({ type: "go", chapter }),
      next: () => dispatch({ type: "next" }),
      acceptPassword: () => dispatch({ type: "acceptPassword" }),
      completeSudoku: (opts) => dispatch({ type: "completeSudoku", assisted: opts?.assisted === true }),
      openGift: () => dispatch({ type: "openGift" }),
      selectKingdom: (kingdom) => dispatch({ type: "selectKingdom", kingdom }),
      confirmKingdom: async (kingdom) => {
        const id = stateRef.current.experienceId;
        dispatch({ type: "confirmKingdom", kingdom });
        const ok = await postChoice(id, kingdom);
        if (ok) dispatch({ type: "synced", kingdom });
      },
      setSound: (on) => {
        setAudioEnabled(on, true);
        dispatch({ type: "setSound", on });
      },
      resetPuzzle: () => {
        safeRemove(SUDOKU_STORAGE_KEY);
        dispatch({ type: "resetPuzzle" });
      },
      resetAll: () => {
        safeRemove(SUDOKU_STORAGE_KEY);
        safeRemove(STORAGE_KEY);
        setAudioEnabled(false);
        dispatch({ type: "resetAll", id: makeId() });
      },
    }),
    [],
  );

  const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useExperience(): ExperienceState & ExperienceActions {
  const v = useContext(Ctx);
  if (!v) throw new Error("useExperience() must be used inside <ExperienceProvider>");
  return v;
}
