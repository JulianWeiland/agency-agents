"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useExperience } from "@/lib/store";
import { story } from "@/lib/story";
import { assets } from "@/lib/assets";
import { chime } from "@/lib/audio";
import { Backdrop, Button, FadeLines, GoldRule, Particles, type FadeLine } from "@/components/ui";
import { Constellation, DRAW_SECONDS } from "./cosmic/Constellation";

const NEBULA = `
.cos-nebula {
  background:
    radial-gradient(62% 34% at 64% 22%, rgba(179,18,63,0.5), transparent 72%),
    radial-gradient(54% 30% at 26% 40%, rgba(244,183,195,0.17), transparent 70%),
    radial-gradient(70% 36% at 40% 30%, rgba(133,12,48,0.42), transparent 74%),
    radial-gradient(60% 30% at 50% 100%, rgba(215,180,123,0.1), transparent 70%),
    linear-gradient(180deg, #08050b 0%, #130b18 42%, #1d0c18 100%);
}
`;

const body = "font-display text-[1.28rem] leading-[1.32] text-[#f3e7d6]/90 [text-wrap:balance]";

const STANZAS: readonly (readonly FadeLine[])[] = [
  [
    {
      text: story.cosmic.lines[0],
      className: "headline text-gold-foil animate-shimmer pb-1 text-[clamp(1.85rem,8.4vw,2.3rem)] max-w-[18rem]",
    },
    { text: story.cosmic.lines[1], className: `${body} max-w-[19rem] italic` },
  ],
  [
    { text: story.cosmic.lines[2], className: `${body} max-w-[19.5rem]` },
    { text: story.cosmic.lines[3], className: `${body} italic text-[#f7ece0]`, pause: 0.3 },
    { text: story.cosmic.lines[4], className: `${body} italic text-[#f7ece0]`, pause: -0.2 },
    { text: story.cosmic.russian, className: "script mt-1 text-[1.7rem] text-blush", pause: 0.3 },
  ],
  [
    { text: story.cosmic.strategy, className: `${body} max-w-[18rem] italic` },
    {
      text: story.cosmic.rookie,
      className: "headline text-gold-foil animate-shimmer pb-1 text-[clamp(2.3rem,10.5vw,2.9rem)]",
      pause: 0.2,
    },
  ],
];
const LAST = STANZAS.length - 1;

export default function Cosmic() {
  const { next } = useExperience();
  const reduced = useReducedMotion();
  const [drawn, setDrawn] = useState(false);
  const [skippedDraw, setSkippedDraw] = useState(false);
  const [stanza, setStanza] = useState(0);
  const [linesDone, setLinesDone] = useState(false);
  const doneAt = useRef(0);
  const mountedAt = useRef(0);

  useEffect(() => {
    mountedAt.current = Date.now();
    const id = window.setTimeout(() => setDrawn(true), (reduced ? 0.4 : DRAW_SECONDS) * 1000);
    return () => window.clearTimeout(id);
  }, [reduced]);

  useEffect(() => {
    if (drawn) chime();
  }, [drawn]);

  const advance = useCallback(() => {
    setLinesDone(false);
    setStanza((s) => Math.min(LAST, s + 1));
  }, []);

  // a reading pause, then the next thought arrives by itself
  useEffect(() => {
    if (!linesDone || stanza >= LAST) return;
    const id = window.setTimeout(advance, 3400);
    return () => window.clearTimeout(id);
  }, [linesDone, stanza, advance]);

  const onTap = () => {
    const now = Date.now();
    if (!drawn) {
      if (now - mountedAt.current < 350) return;
      setSkippedDraw(true);
      setDrawn(true);
      return;
    }
    // the tap that fast-forwards a stanza must not also dismiss it
    if (linesDone && stanza < LAST && now - doneAt.current > 450) advance();
  };

  const showCta = stanza === LAST && linesDone;

  return (
    <section
      className="chapter items-center text-center text-[#f3e7d6]"
      onClick={onTap}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) onTap();
      }}
    >
      <style>{NEBULA}</style>
      <Backdrop
        image={assets.scorpio.image}
        fallbackClassName="cos-nebula"
        overlay="bg-[linear-gradient(180deg,rgba(8,5,11,0.5)_0%,rgba(8,5,11,0.22)_36%,rgba(8,5,11,0.82)_100%)]"
      />
      <Particles variant="sparkle" count={16} />

      <div className="relative z-10 flex w-full max-w-[24rem] flex-1 flex-col items-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="mt-[clamp(1.75rem,5.5dvh,3.5rem)] flex flex-col items-center gap-2"
        >
          <p className="label-caps text-gold">{story.cosmic.sign}</p>
          <GoldRule tone="gold" ornament="star" width={96} />
        </motion.div>

        <div className="relative mt-[clamp(0.25rem,1.5dvh,1.25rem)] aspect-square w-[min(80vw,37dvh,21rem)]">
          <div
            aria-hidden
            className="absolute inset-[-12%] animate-slow-glow rounded-full"
            style={{
              background: "radial-gradient(closest-side, rgba(179,18,63,0.22), rgba(244,183,195,0.06) 55%, transparent 78%)",
              animationDuration: "9s",
            }}
          />
          <Constellation instant={skippedDraw || !!reduced} />
        </div>

        <div className="flex min-h-[13.5rem] w-full flex-1 flex-col items-center justify-center py-3">
          <AnimatePresence mode="wait">
            {drawn && (
              <motion.div
                key={stanza}
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: reduced ? 0 : -8, filter: reduced ? "blur(0px)" : "blur(4px)" }}
                transition={{ duration: 0.5 }}
                className="w-full"
              >
                <FadeLines
                  lines={STANZAS[stanza]}
                  delay={0.25}
                  stagger={stanza === 1 ? 1.55 : 1.35}
                  className="flex flex-col items-center gap-[0.7rem] text-center"
                  onDone={() => {
                    doneAt.current = Date.now();
                    setLinesDone(true);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative flex min-h-[54px] w-full items-center justify-center pb-2">
          <motion.p
            aria-hidden={!(linesDone && stanza < LAST)}
            initial={false}
            animate={{ opacity: linesDone && stanza < LAST ? 0.55 : 0 }}
            transition={{ duration: 0.6, delay: linesDone && stanza < LAST ? 0.5 : 0 }}
            className="label-caps pointer-events-none absolute text-[0.625rem] text-gold"
          >
            {story.common.skip}
          </motion.p>
          <motion.div
            initial={false}
            animate={{ opacity: showCta ? 1 : 0, y: showCta || reduced ? 0 : 8 }}
            transition={{ duration: 0.8 }}
            className={`w-full ${showCta ? "" : "pointer-events-none"}`}
          >
            <Button variant="gold" full disabled={!showCta} onClick={() => next()}>
              {story.cosmic.cta}
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
