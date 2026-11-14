"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

export interface ToastProps {
  /** the message to show; null/empty hides the toast */
  message: ReactNode | null;
  /** called after `duration` so the parent can clear `message` */
  onClear?: () => void;
  /** milliseconds on screen (default 2600) */
  duration?: number;
  /** 'top' (default, below the safe area) or 'bottom' */
  position?: "top" | "bottom";
  /** 'royal' = ivory pill with ruby text (default) · 'midnight' = velvet pill with gold text */
  tone?: "royal" | "midnight";
  /** change this to re-trigger the timer for an identical message */
  id?: string | number;
}

const subscribe = () => () => {};

/**
 * Rare, non-blocking whisper ("Beautifully played."). Controlled:
 *   const [msg, setMsg] = useState<string | null>(null);
 *   <Toast message={msg} onClear={() => setMsg(null)} />
 */
export function Toast({ message, onClear, duration = 2600, position = "top", tone = "royal", id }: ToastProps) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const onClearRef = useRef(onClear);
  const visible = message !== null && message !== undefined && message !== "";
  // keep the last message on screen while the pill fades out
  const [last, setLast] = useState<ReactNode>(message);
  if (visible && message !== last) setLast(message);

  useEffect(() => {
    onClearRef.current = onClear;
  }, [onClear]);

  useEffect(() => {
    if (!visible) return;
    const t = window.setTimeout(() => onClearRef.current?.(), duration);
    return () => window.clearTimeout(t);
  }, [visible, message, id, duration]);

  if (!mounted) return null;
  const royal = tone === "royal";
  const top = position === "top";

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-6"
      style={
        top
          ? { top: "max(3.75rem, calc(env(safe-area-inset-top) + 3rem))" }
          : { bottom: "max(5.5rem, calc(env(safe-area-inset-bottom) + 4.5rem))" }
      }
    >
      <AnimatePresence mode="wait">
        {visible && (
          <motion.div
            key={String(id ?? (typeof message === "string" ? message : "toast"))}
            initial={{ opacity: 0, y: top ? -8 : 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: top ? -6 : 6 }}
            transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
            className="max-w-[20rem] rounded-full px-5 py-2.5 text-center font-display text-[1.0625rem] italic leading-snug"
            style={
              royal
                ? {
                    background: "rgba(255,248,240,0.96)",
                    color: "#850C30",
                    boxShadow: "0 0 0 1px rgba(215,180,123,0.7), 0 12px 32px -12px rgba(133,12,48,0.45)",
                  }
                : {
                    background: "rgba(40,15,29,0.94)",
                    color: "#F0DCB4",
                    boxShadow: "0 0 0 1px rgba(215,180,123,0.45), 0 12px 32px -12px rgba(0,0,0,0.8)",
                  }
            }
          >
            {last}
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}

export default Toast;
