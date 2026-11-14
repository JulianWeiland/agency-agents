"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { tap } from "@/lib/audio";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 'gold'  — champagne-foil primary for the dark world (portal / fidelio / cosmic)
   * 'ruby'  — ruby primary with gold hairline for the pink world
   * 'ghost' — outlined secondary; inherits `color` from its parent, works in both worlds
   */
  variant?: "gold" | "ruby" | "ghost";
  /** 'md' = 54px tall (default) · 'sm' = 48px tall */
  size?: "md" | "sm";
  /** stretch to the container width */
  full?: boolean;
  /** slow light sweep across the button (default: on for gold/ruby, off for ghost) */
  sheen?: boolean;
  /** play the soft tap sound when sound is on (default true) */
  sound?: boolean;
  children: ReactNode;
}

/** Elegant letter-spaced serif-caps button. ≥48px touch target, no hover dependence. */
export function Button({
  variant = "gold",
  size = "md",
  full = false,
  sheen,
  sound = true,
  className = "",
  type = "button",
  onClick,
  children,
  ...rest
}: ButtonProps) {
  const withSheen = sheen ?? variant !== "ghost";
  const cls = [
    "btn",
    `btn-${variant}`,
    size === "sm" ? "btn-sm" : "",
    full ? "btn-full" : "",
    withSheen ? "btn-sheen" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type={type}
      className={cls}
      onClick={(e) => {
        if (sound) tap();
        onClick?.(e);
      }}
      {...rest}
    >
      <span className="relative z-[2]">{children}</span>
    </button>
  );
}

export default Button;
