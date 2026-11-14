"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Tiny timeline: `step` counts up as each absolute time (seconds) in `times` passes.
 * A tap / key anywhere jumps to the end — no cinematic is ever a dead end.
 * `times` must be a stable (module-level) array.
 */
export function useSequence(times: readonly number[], instant = false) {
  const total = times.length;
  const [step, setStep] = useState(instant ? total : 0);
  const [skipped, setSkipped] = useState(instant);

  useEffect(() => {
    if (step >= total) return;
    const wait = times[step] - (step > 0 ? times[step - 1] : 0);
    const id = window.setTimeout(() => setStep((s) => Math.min(total, s + 1)), Math.max(0, wait) * 1000);
    return () => window.clearTimeout(id);
  }, [step, total, times]);

  const skip = useCallback(() => {
    setSkipped(true);
    setStep(total);
  }, [total]);

  useEffect(() => {
    if (step >= total) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") skip();
    };
    const arm = window.setTimeout(() => {
      window.addEventListener("pointerdown", skip, { passive: true });
      window.addEventListener("keydown", onKey);
    }, 300);
    return () => {
      window.clearTimeout(arm);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", onKey);
    };
  }, [step, total, skip]);

  return { step, skipped, done: step >= total, skip };
}

/** mulberry32 — deterministic PRNG so decorative geometry is identical on every render */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const VELVET_EASE = [0.22, 0.61, 0.36, 1] as const;
