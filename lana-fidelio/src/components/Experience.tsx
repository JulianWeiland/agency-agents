"use client";

import { useEffect, type ComponentType } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  CHAPTER_ORDER,
  ExperienceProvider,
  isChapterId,
  useExperience,
  type BootstrapTools,
  type ChapterId,
  type ExperienceState,
} from "@/lib/store";
import { assets, preloadImages } from "@/lib/assets";
import { setWorld, worldFor } from "@/lib/world";
import { SoundToggle } from "@/components/ui/SoundToggle";

import Portal from "@/components/chapters/Portal";
import Fidelio from "@/components/chapters/Fidelio";
import Cosmic from "@/components/chapters/Cosmic";
import SudokuChapter from "@/components/chapters/SudokuChapter";
import Dates from "@/components/chapters/Dates";
import Gift from "@/components/chapters/Gift";
import Kingdoms from "@/components/chapters/Kingdoms";
import Decree from "@/components/chapters/Decree";
import Finale from "@/components/chapters/Finale";

const CHAPTERS: Record<ChapterId, ComponentType> = {
  portal: Portal,
  fidelio: Fidelio,
  cosmic: Cosmic,
  sudoku: SudokuChapter,
  dates: Dates,
  gift: Gift,
  kingdoms: Kingdoms,
  decree: Decree,
  finale: Finale,
};

/** Poster images each chapter needs — the NEXT chapter's are preloaded while the current one plays. */
const POSTERS: Record<ChapterId, readonly string[]> = {
  portal: [assets.portal.image],
  fidelio: [assets.chamber.image, assets.mask.image],
  cosmic: [assets.scorpio.image],
  sudoku: [],
  dates: [assets.bloom.image],
  gift: [assets.bloom.image, assets.giftbox.closed, assets.giftbox.open],
  kingdoms: [assets.sea.image, assets.balance.image],
  decree: [assets.paper.image, assets.signature.mask],
  finale: [assets.bloom.image],
};

/**
 * Query params, handled exactly once on the freshly-loaded state, then stripped from the URL:
 *   ?reset=1          wipe everything first
 *   ?sudoku=solved    the sudoku chapter auto-solves itself (state.bypassSudoku)
 *   ?chapter=<id>     jump straight to a chapter (testing) with its prerequisite flags set
 */
function applyQueryParams(loaded: ExperienceState, tools: BootstrapTools): ExperienceState {
  let s = loaded;
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(window.location.search);
  } catch {
    return s;
  }
  const had = params.has("reset") || params.has("sudoku") || params.has("chapter");
  if (!had) return s;

  const reset = params.get("reset");
  if (reset !== null && reset !== "0" && reset !== "false") s = tools.fresh();
  if (params.get("sudoku") === "solved" && !s.sudokuSolved) s = { ...s, bypassSudoku: true };
  const chapter = params.get("chapter");
  if (isChapterId(chapter)) s = tools.withPrerequisites(s, chapter);

  try {
    params.delete("reset");
    params.delete("sudoku");
    params.delete("chapter");
    const q = params.toString();
    // keep Next's own history state object intact
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname + (q ? `?${q}` : "") + window.location.hash,
    );
  } catch {
    /* ignore */
  }
  return s;
}

function Stage() {
  const { hydrated, chapter } = useExperience();
  const reduced = useReducedMotion();

  // world (background, theme-colour) + scroll reset on every chapter change
  useEffect(() => {
    if (!hydrated) return;
    setWorld(worldFor(chapter));
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [hydrated, chapter]);

  // warm the next chapter's posters once the current one has settled
  useEffect(() => {
    if (!hydrated) return;
    const next = CHAPTER_ORDER[CHAPTER_ORDER.indexOf(chapter) + 1];
    if (!next) return;
    const id = window.setTimeout(() => void preloadImages(POSTERS[next]), 900);
    return () => window.clearTimeout(id);
  }, [hydrated, chapter]);

  if (!hydrated) {
    // neutral dark screen until localStorage has been read (also the SSR output)
    return <main className="stage" aria-busy="true" />;
  }

  const Chapter = CHAPTERS[chapter];
  const d = reduced ? 0.25 : 0.75;

  return (
    <main className="stage" data-chapter={chapter}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={chapter}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: d, ease: [0.22, 0.61, 0.36, 1] } }}
          exit={{ opacity: 0, transition: { duration: d * 0.8, ease: [0.4, 0, 0.6, 1] } }}
          className="relative min-h-[100dvh] w-full"
        >
          <Chapter />
        </motion.div>
      </AnimatePresence>
      <SoundToggle />
    </main>
  );
}

export default function Experience() {
  return (
    <ExperienceProvider bootstrap={applyQueryParams}>
      <Stage />
    </ExperienceProvider>
  );
}
