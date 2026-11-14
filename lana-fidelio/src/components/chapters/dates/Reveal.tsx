"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

/** One line of a sequenced reveal: fades up when `show` turns true, keeps its space before that. */
export function Reveal({
  show,
  fast = false,
  duration = 1,
  className = "",
  children,
}: {
  show: boolean;
  /** shorten the fade (after a skip) */
  fast?: boolean;
  duration?: number;
  className?: string;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={false}
      animate={
        show
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y: reduced ? 0 : 12, filter: reduced ? "blur(0px)" : "blur(5px)" }
      }
      transition={{ duration: fast || reduced ? 0.4 : duration, ease: [0.22, 0.61, 0.36, 1] }}
      aria-hidden={show ? undefined : true}
      className={className}
    >
      {children}
    </motion.div>
  );
}
