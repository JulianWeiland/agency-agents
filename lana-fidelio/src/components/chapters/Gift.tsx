"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useExperience } from "@/lib/store";
import { story } from "@/lib/story";
import { assets } from "@/lib/assets";
import { chime, shimmer } from "@/lib/audio";
import { Backdrop, Button, GoldRule, Particles, Signature } from "@/components/ui";
import { GiftBox } from "./gift/GiftBox";
import { Reveal } from "./dates/Reveal";
import { useReveal } from "./dates/useReveal";

type Stage = "closed" | "opening" | "open";

const EASE = [0.22, 0.61, 0.36, 1] as const;

/** headline · reveal · three lines · handwritten footer */
const STEPS = 6;
const PAUSES = [0, 0.25, 0.45, 0, 0, 0.35] as const;
/** safety net: the copy always arrives, whatever the box animation does */
const OPENING_FAILSAFE_MS = 8000;

/** box edge while wrapped / once the letter is being read */
const BOX_CLOSED = "min(72vw, 300px, 40dvh)";
const BOX_OPEN = "clamp(84px, 13dvh, 148px)";
/** space above the box: centres it while wrapped, tucks it under the top edge afterwards */
const TOP_CLOSED = "calc(51dvh - min(36vw, 150px, 20dvh) - 1.25rem)";
const TOP_OPEN = "clamp(0.75rem, 3.4dvh, 2rem)";

export default function Gift() {
  const { giftOpened, openGift, next } = useExperience();
  const reduced = useReducedMotion();
  // revisits (refresh / replay) land directly on the opened gift
  const [instant] = useState(giftOpened);
  const [stage, setStage] = useState<Stage>(giftOpened ? "open" : "closed");

  const open = useCallback(() => {
    setStage((s) => {
      if (s !== "closed") return s;
      return "opening";
    });
    openGift();
    shimmer();
  }, [openGift]);

  const finishOpening = useCallback(() => {
    setStage((s) => (s === "opening" ? "open" : s));
  }, []);

  useEffect(() => {
    if (stage !== "opening") return;
    const id = window.setTimeout(finishOpening, OPENING_FAILSAFE_MS);
    return () => window.clearTimeout(id);
  }, [stage, finishOpening]);

  useEffect(() => {
    if (stage === "open" && !instant) chime();
  }, [stage, instant]);

  const isOpen = stage === "open";
  const unwrapped = stage !== "closed";
  const reveal = useReveal(STEPS, {
    active: isOpen,
    instant,
    delay: 0.7,
    stagger: 1.15,
    pauses: PAUSES,
  });

  const move = reduced || instant ? "none" : "height 1.3s cubic-bezier(0.22,0.61,0.36,1), width 1.3s cubic-bezier(0.22,0.61,0.36,1)";

  return (
    <section
      className="chapter items-center text-center text-ink"
      onClick={stage === "opening" ? finishOpening : undefined}
    >
      <Backdrop
        image={assets.bloom.image}
        video={assets.bloom.video}
        fallbackClassName="bg-royal"
        overlay="bg-[radial-gradient(88%_60%_at_50%_52%,rgba(255,248,240,0.9),rgba(255,248,240,0.55)_60%,rgba(255,248,240,0.1)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1/2 animate-slow-glow"
        style={{ background: "radial-gradient(70% 70% at 50% 0%, rgba(240,220,180,0.5), transparent 70%)" }}
      />
      <Particles variant="petals" count={8} color="#EE9DB0" intensity={0.75} />
      <Particles variant="sparkle" count={unwrapped ? 14 : 8} color="#C9A465" intensity={0.7} />

      {/* ── space above the box, holding the invitation to open it ── */}
      <div className="relative z-10 w-full shrink-0" style={{ height: isOpen ? TOP_OPEN : TOP_CLOSED, transition: move }}>
        <AnimatePresence>
          {!unwrapped && (
            <motion.div
              key="before"
              className="absolute inset-x-0 bottom-10 flex flex-col items-center gap-4"
              initial={{ opacity: 0, y: reduced ? 0 : 10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 1.1, delay: 0.5, ease: EASE } }}
              exit={{ opacity: 0, y: reduced ? 0 : -8, transition: { duration: 0.5 } }}
            >
              <h1 className="headline text-[2.15rem] italic text-ruby [text-shadow:0_0_14px_rgba(255,248,240,0.95),0_0_28px_rgba(255,248,240,0.9)]">{story.gift.before}</h1>
              <GoldRule tone="rose" ornament="heart" width={140} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── the gift ── */}
      <div
        className="relative z-10 shrink-0"
        style={{ width: isOpen ? BOX_OPEN : BOX_CLOSED, height: isOpen ? BOX_OPEN : BOX_CLOSED, transition: move }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          disabled={unwrapped}
          aria-label={unwrapped ? undefined : story.gift.hint}
          aria-hidden={unwrapped ? true : undefined}
          tabIndex={unwrapped ? -1 : 0}
          className="block h-full w-full rounded-full disabled:cursor-default"
        >
          <span className={`block h-full w-full ${unwrapped || reduced ? "" : "animate-float"}`}>
            <GiftBox open={unwrapped} instant={instant} onOpened={finishOpening} />
          </span>
        </button>
        <AnimatePresence>
          {!unwrapped && (
            <motion.p
              key="hint"
              aria-hidden="true"
              className="label-caps pointer-events-none absolute inset-x-0 top-full mt-6 text-gold-deep"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.5, 1], transition: { duration: 3.4, delay: 1.5, times: [0, 0.3, 0.65, 1], repeat: Infinity, repeatType: "mirror" } }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
            >
              {story.gift.hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── the letter ── */}
      {isOpen && (
        <div className="relative z-10 flex w-full flex-1 flex-col items-center">
          <div className="flex w-full flex-1 flex-col items-center justify-center py-2">
            <Reveal show={reveal.shown >= 1} fast={reveal.skipped}>
              <p className="font-display text-[1.45rem] italic leading-snug text-ink">{story.gift.headline}</p>
            </Reveal>
            <Reveal show={reveal.shown >= 2} fast={reveal.skipped} duration={1.4} className="mt-3">
              <h1
                className="headline font-semibold text-ruby-foil animate-shimmer"
                style={{ fontSize: "clamp(2rem, 9.4vw, 2.5rem)", lineHeight: 1.08 }}
              >
                {story.gift.reveal}
              </h1>
              <GoldRule tone="rose" ornament="heart" width={150} className="mt-4" />
            </Reveal>
            <div className="mt-4 flex max-w-[21rem] flex-col gap-2.5 font-display text-[1.2rem] leading-[1.32] text-ink">
              {story.gift.lines.map((line, i) => (
                <Reveal key={line} show={reveal.shown >= 3 + i} fast={reveal.skipped}>
                  <p className="text-balance">{line}</p>
                </Reveal>
              ))}
            </div>
            <Reveal show={reveal.shown >= 6} fast={reveal.skipped} className="mt-5 flex flex-col items-center">
              <p className="script text-[1.75rem] text-ruby">{story.gift.footer}</p>
              <div className="-mt-1 h-[45px]">
                {reveal.shown >= 6 && <Signature tone="ruby" width={140} write={!reduced} delay={instant || reveal.skipped ? 0.2 : 0.7} />}
              </div>
            </Reveal>
          </div>

          <motion.div
            initial={false}
            animate={{ opacity: reveal.done ? 1 : 0, y: reveal.done ? 0 : 10 }}
            transition={{ duration: 0.9, delay: reveal.done && !reveal.skipped ? 1.2 : 0, ease: EASE }}
            className="w-full"
            style={{ pointerEvents: reveal.done ? "auto" : "none" }}
          >
            <Button variant="ruby" full disabled={!reveal.done} onClick={() => next()} className="!tracking-[0.18em]">
              {story.gift.cta}
            </Button>
          </motion.div>
        </div>
      )}
    </section>
  );
}
