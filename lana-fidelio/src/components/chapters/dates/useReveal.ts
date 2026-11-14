"use client";

import { useEffect, useState } from "react";

export interface RevealOptions {
  /** start counting (default true) */
  active?: boolean;
  /** start fully revealed (revisits) */
  instant?: boolean;
  /** seconds before the first step */
  delay?: number;
  /** seconds between steps */
  stagger?: number;
  /** extra seconds before step i (module-level constant, must be referentially stable) */
  pauses?: readonly number[];
  /** tap / key anywhere reveals everything (default true) */
  skippable?: boolean;
}

/**
 * Step counter for sequenced reveals: `shown` grows from 0 to `total`.
 * A tap or key anywhere reveals every step at once, so no sequence is a dead end.
 */
export function useReveal(
  total: number,
  { active = true, instant = false, delay = 0.3, stagger = 1.1, pauses, skippable = true }: RevealOptions = {},
) {
  const [shown, setShown] = useState(instant ? total : 0);
  const [skipped, setSkipped] = useState(instant);

  useEffect(() => {
    if (!active || shown >= total) return;
    const wait = (shown === 0 ? delay : stagger) + (pauses?.[shown] ?? 0);
    const id = window.setTimeout(() => setShown((s) => Math.min(total, s + 1)), wait * 1000);
    return () => window.clearTimeout(id);
  }, [active, shown, total, delay, stagger, pauses]);

  const pending = shown < total;
  useEffect(() => {
    if (!active || !skippable || !pending) return;
    const skip = () => {
      setSkipped(true);
      setShown(total);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") skip();
    };
    // guard so the tap that started the sequence does not also skip it
    const arm = window.setTimeout(() => {
      window.addEventListener("pointerdown", skip, { passive: true });
      window.addEventListener("keydown", onKey);
    }, 450);
    return () => {
      window.clearTimeout(arm);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", onKey);
    };
  }, [active, skippable, pending, total]);

  return { shown, skipped, done: shown >= total };
}
