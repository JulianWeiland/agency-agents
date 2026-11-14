"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useExperience } from "@/lib/store";
import { story } from "@/lib/story";
import { assets } from "@/lib/assets";
import { useImageOk } from "@/lib/useImage";
import { chime, shimmer } from "@/lib/audio";
import { Backdrop, Button, FadeLines, GoldRule, Particles, QuillFlower } from "@/components/ui";

const EASE = [0.22, 0.61, 0.36, 1] as const;
const HEART = "♡";
const LONG_PRESS_MS = 550;

export default function Finale() {
  const { go, resetPuzzle } = useExperience();
  const reduced = useReducedMotion();
  const bloomOk = useImageOk(assets.bloom.image);

  const [linesDone, setLinesDone] = useState(false);
  const [egg, setEgg] = useState(false);
  const [pressing, setPressing] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    shimmer();
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const birthday = story.finale.birthday.endsWith(HEART)
    ? story.finale.birthday.slice(0, -HEART.length).trimEnd()
    : story.finale.birthday;

  const startPress = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setPressing(true);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setPressing(false);
      setEgg(true);
      chime();
      try {
        navigator.vibrate?.(12);
      } catch {
        /* ignore */
      }
    }, LONG_PRESS_MS);
  };
  const endPress = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPressing(false);
  };

  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: reduced ? 0 : 10 },
    animate: linesDone ? { opacity: 1, y: 0 } : { opacity: 0, y: reduced ? 0 : 10 },
    transition: { duration: 0.9, ease: EASE, delay: linesDone ? delay : 0 },
  });

  return (
    <section className="chapter items-center text-center text-ink" aria-label={story.finale.birthday}>
      <Backdrop
        image={assets.bloom.image}
        video={assets.bloom.video}
        fallbackClassName="bg-royal"
        overlay="bg-[radial-gradient(85%_60%_at_50%_42%,rgba(255,248,240,0.9),rgba(251,227,231,0.62)_55%,rgba(251,227,231,0.2)_100%)]"
      />
      <Particles variant="petals" count={12} />

      {/* quilled bouquet — part of the composition even before the backdrop arrives */}
      {bloomOk === false && (
        <>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-40">
        <div className="absolute -left-6 -top-5 opacity-90">
          <QuillFlower size={118} leaf unfurl rotate={-20} color="#EE9FB0" />
        </div>
        <div className="absolute left-[74px] top-[6px] opacity-80">
          <QuillFlower size={46} petals={5} unfurl delay={0.5} rotate={14} />
        </div>
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-40">
        <div className="absolute -bottom-7 -right-7 opacity-90">
          <QuillFlower size={124} leaf unfurl delay={0.3} rotate={158} color="#EE9FB0" />
        </div>
        <div className="absolute bottom-[10px] right-[80px] opacity-80">
          <QuillFlower size={44} petals={5} unfurl delay={0.8} rotate={-12} center="#C98D93" />
        </div>
      </div>
        </>
      )}

      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center pt-12">
        <FadeLines
          lines={story.finale.lines.map((text, i) => ({
            text,
            className:
              i === 0
                ? "headline max-w-[19rem] text-[1.75rem] text-ink"
                : "headline text-[2.5rem] italic text-ruby",
          }))}
          delay={0.5}
          stagger={1.5}
          instant={!!reduced}
          onDone={() => setLinesDone(true)}
          className="flex flex-col items-center gap-2.5 text-center"
        />

        <motion.div {...reveal(0.2)} className="mt-6">
          <GoldRule color="#A47E45" width={150} ornament="star" />
        </motion.div>

        <motion.h1 {...reveal(0.5)} className="script mt-5 text-[2.05rem] !leading-[1.2] text-ruby">
          {birthday}{" "}
          <button
            type="button"
            aria-label={HEART}
            aria-expanded={egg}
            onPointerDown={startPress}
            onPointerUp={endPress}
            onPointerLeave={endPress}
            onPointerCancel={endPress}
            onContextMenu={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setEgg(true);
              }
            }}
            className="-mx-3 -my-2 inline-flex h-11 w-11 touch-none select-none items-center justify-center align-middle font-display text-[1.9rem] not-italic text-ruby"
            style={{
              WebkitTouchCallout: "none",
              WebkitUserSelect: "none",
              transform: `scale(${pressing ? 1.28 : egg ? 1.08 : 1})`,
              transition: `transform ${pressing ? LONG_PRESS_MS : 500}ms cubic-bezier(0.22,0.61,0.36,1), text-shadow 600ms ease`,
              textShadow: pressing || egg ? "0 0 18px rgba(194,37,79,0.55)" : "none",
            }}
          >
            {HEART}
          </button>
        </motion.h1>

        <motion.p {...reveal(0.9)} className="mt-3 max-w-[17rem] font-display text-[1.12rem] italic leading-snug text-ink-soft">
          {story.finale.small}
        </motion.p>

        <p
          aria-live="polite"
          className={`mt-4 flex min-h-[2.6rem] max-w-[16rem] items-center font-display text-[1rem] italic leading-snug text-gold-deep transition-opacity duration-1000 ease-velvet ${
            egg ? "opacity-100" : "opacity-0"
          }`}
        >
          {egg ? story.finale.easterEgg : " "}
        </p>
      </div>

      <motion.div {...reveal(1.3)} className="relative z-10 mt-4 flex w-full max-w-[21rem] shrink-0 flex-col gap-3">
        <Button variant="ruby" full onClick={() => go("decree")} tabIndex={linesDone ? 0 : -1}>
          {story.finale.revisitCta}
        </Button>
        <div className="text-ruby">
          <Button variant="ghost" full size="sm" className="bg-ivory/80 backdrop-blur-sm" onClick={() => go("portal")} tabIndex={linesDone ? 0 : -1}>
            {story.finale.reliveCta}
          </Button>
        </div>
        <button
          type="button"
          tabIndex={linesDone ? 0 : -1}
          onClick={() => {
            resetPuzzle();
            go("sudoku");
          }}
          className="mx-auto flex h-11 items-center rounded-full bg-ivory/75 px-5 font-display text-[1rem] italic text-ink backdrop-blur-sm underline decoration-gold-deep/60 decoration-1 underline-offset-[5px]"
        >
          {story.finale.sudokuAgain}
        </button>
      </motion.div>
    </section>
  );
}
