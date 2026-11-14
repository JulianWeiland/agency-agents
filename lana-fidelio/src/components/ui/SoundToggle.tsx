"use client";

import { Volume2, VolumeX } from "lucide-react";
import { chime } from "@/lib/audio";
import { useExperience } from "@/lib/store";
import { story } from "@/lib/story";

export interface SoundToggleProps {
  className?: string;
}

/**
 * Discreet sound switch, fixed to the top-right of the stage (safe-area aware).
 * Rendered once by <Experience>; chapters do not need to render it.
 * Colour follows the world via --world-accent.
 */
export function SoundToggle({ className = "" }: SoundToggleProps) {
  const { soundOn, setSound } = useExperience();
  const label = soundOn ? story.common.soundOn : story.common.soundOff;
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={soundOn}
      title={label}
      onClick={() => {
        const on = !soundOn;
        setSound(on);
        // the context unlocks inside this gesture; greet with one soft bell
        if (on) window.setTimeout(chime, 140);
      }}
      className={`fixed z-40 flex h-11 w-11 items-center justify-center rounded-full transition-opacity duration-500 ${
        soundOn ? "opacity-80" : "opacity-45"
      } active:opacity-100 ${className}`}
      style={{
        top: "max(0.5rem, env(safe-area-inset-top))",
        right: "max(0.5rem, calc((100vw - 480px) / 2 + 0.5rem), env(safe-area-inset-right))",
        color: "var(--world-accent)",
      }}
    >
      <span
        className="flex h-8 w-8 items-center justify-center rounded-full"
        style={{
          boxShadow: "inset 0 0 0 1px color-mix(in srgb, currentColor 35%, transparent)",
          background: "color-mix(in srgb, var(--world-bg) 55%, transparent)",
          WebkitBackdropFilter: "blur(6px)",
          backdropFilter: "blur(6px)",
        }}
      >
        {soundOn ? <Volume2 size={14} strokeWidth={1.5} /> : <VolumeX size={14} strokeWidth={1.5} />}
      </span>
    </button>
  );
}

export default SoundToggle;
