"use client";

import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export interface SheetProps {
  open: boolean;
  /** called on backdrop tap, Escape, or swipe intent — always provide a way out */
  onClose: () => void;
  /** heading (real text, announced as the dialog label) */
  title?: ReactNode;
  /** optional supporting copy under the title */
  description?: ReactNode;
  /** body — typically a column of <Button full> actions */
  children?: ReactNode;
  /** 'royal' = blush paper (default) · 'midnight' = dark velvet */
  tone?: "royal" | "midnight";
  /** set false to force an explicit choice (backdrop/Escape won't close) */
  dismissible?: boolean;
  className?: string;
}

const FOCUSABLE =
  'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

const subscribe = () => () => {};

/**
 * Accessible bottom sheet / confirm dialog. Portalled to <body>, constrained to the stage width,
 * traps focus, restores it on close, locks page scroll, slides up with a soft spring.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  tone = "royal",
  dismissible = true,
  className = "",
}: SheetProps) {
  const reduced = useReducedMotion();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const descId = useId();
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFirst = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const first = panel.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel).focus({ preventScroll: true });
    }, 60);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);

    return () => {
      window.clearTimeout(focusFirst);
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prevOverflow;
      previous?.focus?.({ preventScroll: true });
    };
  }, [open, dismissible]);

  if (!mounted) return null;

  const royal = tone === "royal";

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" key="sheet">
          <motion.div
            className="absolute inset-0"
            style={{
              background: royal ? "rgba(74, 21, 38, 0.42)" : "rgba(5, 3, 8, 0.66)",
              WebkitBackdropFilter: "blur(3px)",
              backdropFilter: "blur(3px)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            onClick={dismissible ? onClose : undefined}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 36 }}
            transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
            className={`relative w-full max-w-[480px] rounded-t-[22px] px-6 pt-3 outline-none ${
              royal ? "paper text-ink" : "velvet text-[#F3E7D6]"
            } ${className}`}
            style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
          >
            <div
              aria-hidden="true"
              className="mx-auto mb-5 h-[3px] w-10 rounded-full"
              style={{ background: royal ? "rgba(133,12,48,0.25)" : "rgba(215,180,123,0.4)" }}
            />
            {title && (
              <h2 id={titleId} className="headline text-center text-[1.65rem]">
                {title}
              </h2>
            )}
            {description && (
              <p
                id={descId}
                className={`mx-auto mt-2 max-w-[19rem] text-center text-[0.9375rem] leading-relaxed ${
                  royal ? "text-ink-soft" : "text-[#F3E7D6]/70"
                }`}
              >
                {description}
              </p>
            )}
            {children && <div className="mt-6 flex flex-col gap-3">{children}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default Sheet;
