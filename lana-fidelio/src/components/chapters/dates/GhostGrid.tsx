"use client";

import { motion, useReducedMotion } from "motion/react";

/** deterministic pseudo-random in 0..1 (pure, so it is safe during render) */
const hash = (i: number, salt: number) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** the handful of cells that keep glowing after the solve */
const GLOW = new Set([4, 10, 16, 22, 30, 40, 50, 58, 64, 70, 76]);

const CELLS = Array.from({ length: 81 }, (_, i) => {
  const row = Math.floor(i / 9);
  const col = i % 9;
  const dx = col - 4;
  const dy = row - 4;
  const dist = Math.hypot(dx, dy) / 5.66;
  return {
    i,
    row,
    col,
    glow: GLOW.has(i),
    /** when (0..1 of the timeline) this cell lets go — centre first, with jitter */
    start: 0.3 + dist * 0.22 + hash(i, 1) * 0.16,
    x: dx * 9 + (hash(i, 2) - 0.5) * 46,
    y: dy * 7 - 26 - hash(i, 3) * 54,
    rotate: (hash(i, 4) - 0.5) * 150,
  };
});

/**
 * The faint memory of the solved board: a 9×9 gold grid that pulses once and lets its
 * cells drift apart into dust. Purely decorative.
 */
export function GhostGrid({ duration = 2.5 }: { duration?: number }) {
  const reduced = useReducedMotion();
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative aspect-square w-[min(74vw,300px)]"
      style={{ filter: "drop-shadow(0 0 18px rgba(215,180,123,0.28))" }}
    >
      <motion.div
        className="absolute -inset-10 rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(215,180,123,0.3), rgba(179,18,63,0.16) 55%, transparent)" }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0, 1, 0], scale: [0.6, 1.05, 1.35] }}
        transition={{ duration: reduced ? 0.6 : duration * 0.8, ease: "easeOut" }}
      />
      <div className="absolute inset-0 grid grid-cols-9 grid-rows-9">
        {CELLS.map((c) => (
          <motion.span
            key={c.i}
            className="block"
            style={{
              borderTop: `${c.row % 3 === 0 ? 1 : 0.5}px solid rgba(215,180,123,${c.row % 3 === 0 ? 0.62 : 0.3})`,
              borderLeft: `${c.col % 3 === 0 ? 1 : 0.5}px solid rgba(215,180,123,${c.col % 3 === 0 ? 0.62 : 0.3})`,
              borderRight: c.col === 8 ? "1px solid rgba(215,180,123,0.62)" : undefined,
              borderBottom: c.row === 8 ? "1px solid rgba(215,180,123,0.62)" : undefined,
              background: c.glow
                ? "radial-gradient(closest-side, rgba(251,236,203,0.75), rgba(215,180,123,0.22) 70%, transparent)"
                : undefined,
            }}
            initial={{ opacity: 0 }}
            animate={
              reduced
                ? { opacity: [0, 0.8, 0] }
                : {
                    opacity: [0, 0.9, 0.9, 0],
                    scale: [1, 1, 1, c.glow ? 0.5 : 0.12],
                    x: [0, 0, 0, c.x],
                    y: [0, 0, 0, c.y],
                    rotate: [0, 0, 0, c.rotate],
                  }
            }
            transition={
              reduced
                ? { duration: 0.7 }
                : { duration, times: [0, 0.14, Math.min(0.72, c.start), 1], ease: "easeInOut" }
            }
          />
        ))}
      </div>
    </div>
  );
}
