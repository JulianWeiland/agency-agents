"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

export type FadeLine =
  | string
  | {
      /** the copy (string from lib/story) or any node */
      text: ReactNode;
      /** classes for this line (overrides nothing; appended to lineClassName) */
      className?: string;
      /** extra pause (seconds) BEFORE this line, on top of `stagger` */
      pause?: number;
    };

export interface FadeLinesProps {
  lines: readonly FadeLine[];
  /** seconds before the first line (default 0.2) */
  delay?: number;
  /** seconds between lines (default 1.1) */
  stagger?: number;
  /** fade duration per line in seconds (default 0.9) */
  duration?: number;
  /** wrapper classes (default: centred column with gap) */
  className?: string;
  /** classes applied to every line */
  lineClassName?: string;
  /** tap/click/keypress anywhere reveals every line immediately (default true) */
  skippable?: boolean;
  /** start revealed (e.g. when revisiting a chapter) */
  instant?: boolean;
  /** called once, when the last line has appeared (or right after a skip) */
  onDone?: () => void;
}

/**
 * Sequenced line reveal: each line fades up after the previous one.
 * Tap anywhere to reveal everything at once — no cinematic is ever a dead end.
 */
export function FadeLines({
  lines,
  delay = 0.2,
  stagger = 1.1,
  duration = 0.9,
  className = "flex flex-col items-center gap-3 text-center",
  lineClassName = "",
  skippable = true,
  instant = false,
  onDone,
}: FadeLinesProps) {
  const reduced = useReducedMotion();
  const total = lines.length;
  const [shown, setShown] = useState(instant ? total : 0);
  const [skipped, setSkipped] = useState(instant);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const pauseOf = useCallback(
    (i: number) => {
      const l = lines[i];
      return typeof l === "object" && l !== null && "text" in l ? (l.pause ?? 0) : 0;
    },
    [lines],
  );

  // schedule the next line
  useEffect(() => {
    if (shown >= total) return;
    const wait = (shown === 0 ? delay : stagger) + pauseOf(shown);
    const id = window.setTimeout(() => setShown((s) => Math.min(total, s + 1)), wait * 1000);
    return () => window.clearTimeout(id);
  }, [shown, total, delay, stagger, pauseOf]);

  // completion
  useEffect(() => {
    if (shown < total || doneRef.current) return;
    // mark done only when it actually fires, so a re-run of this effect (StrictMode, fast
    // refresh) can never swallow the callback and leave a chapter without its button
    const id = window.setTimeout(() => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDoneRef.current?.();
    }, skipped ? 0 : Math.min(duration, 0.6) * 1000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, total]);

  // tap anywhere to skip
  useEffect(() => {
    if (!skippable || shown >= total) return;
    const skip = () => {
      setSkipped(true);
      setShown(total);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") skip();
    };
    // small guard so the tap that opened this chapter doesn't also skip it
    const arm = window.setTimeout(() => {
      window.addEventListener("pointerdown", skip, { passive: true });
      window.addEventListener("keydown", onKey);
    }, 350);
    return () => {
      window.clearTimeout(arm);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", onKey);
    };
  }, [skippable, shown, total]);

  return (
    <div className={className}>
      {lines.map((l, i) => {
        const obj = typeof l === "object" && l !== null && "text" in l ? l : null;
        const text = obj ? obj.text : (l as string);
        const visible = i < shown;
        return (
          <motion.div
            key={i}
            initial={false}
            animate={
              visible
                ? { opacity: 1, y: 0, filter: "blur(0px)" }
                : { opacity: 0, y: reduced ? 0 : 10, filter: reduced ? "blur(0px)" : "blur(4px)" }
            }
            transition={{ duration: skipped || reduced ? 0.35 : duration, ease: [0.22, 0.61, 0.36, 1] }}
            aria-hidden={visible ? undefined : true}
            className={`${lineClassName} ${obj?.className ?? ""}`}
          >
            {text}
          </motion.div>
        );
      })}
    </div>
  );
}

export default FadeLines;
