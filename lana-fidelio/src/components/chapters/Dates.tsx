"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useExperience } from "@/lib/store";
import { story } from "@/lib/story";
import { assets } from "@/lib/assets";
import { useImageOk } from "@/lib/useImage";
import { setWorld } from "@/lib/world";
import { chime, shimmer, success } from "@/lib/audio";
import { Backdrop, Button, GoldRule, Particles, QuillFlower } from "@/components/ui";
import { GhostGrid } from "./dates/GhostGrid";
import { CrystalBurst } from "./dates/CrystalBurst";
import { Confetti } from "./dates/Confetti";
import { Reveal } from "./dates/Reveal";
import { useReveal } from "./dates/useReveal";

/**
 * 0 the solved grid dissolves · 1 first date · 2 second date ·
 * 3 the signature transition (ruby → rose → blush) · 4 the birthday wish
 */
type Phase = 0 | 1 | 2 | 3 | 4;

/** how long each phase holds before it advances by itself (ms) */
const HOLD: Record<Phase, number> = { 0: 2250, 1: 4800, 2: 5400, 3: 3100, 4: 0 };
const HOLD_REDUCED: Record<Phase, number> = { 0: 900, 1: 4800, 2: 5400, 3: 1100, 4: 0 };

/** not in the SPEC / story.ts: label of the discreet skip control */
const SKIP_LABEL = "Skip";

const EASE = [0.22, 0.61, 0.36, 1] as const;

/** final sequence: line, line, rule, birthday, russian */
const FINAL_STEPS = 5;
const FINAL_PAUSES = [0, 0.5, 0.1, 0.35, 0.5] as const;
const BIRTHDAY_STEP = 4;

function DateBlock({ date, caption }: { date: string; caption: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      layout={reduced ? false : "position"}
      initial={{ opacity: 0, y: reduced ? 0 : 16, scale: reduced ? 1 : 0.96, filter: reduced ? "blur(0px)" : "blur(10px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: reduced ? 0.4 : 1.5, ease: EASE, layout: { duration: 1.1, ease: EASE } }}
      className="relative flex flex-col items-center"
    >
      {/* the golden pulse that carries over from the board */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(215,180,123,0.34), rgba(179,18,63,0.12) 60%, transparent)" }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 1, 0.42], scale: [0.5, 1.15, 1] }}
        transition={{ duration: reduced ? 0.4 : 2.4, ease: "easeOut" }}
      />
      <p
        className="relative font-display font-medium leading-none text-gold-foil animate-shimmer"
        style={{
          fontSize: "clamp(3.25rem, 17.5vw, 4.75rem)",
          fontVariantNumeric: "lining-nums tabular-nums",
          letterSpacing: "0.015em",
        }}
      >
        {date}
      </p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.1, delay: reduced ? 0 : 0.9, ease: EASE }}
        className="relative mt-3 font-display text-[1.3rem] italic leading-snug text-[#f6e9da]"
      >
        {caption}
      </motion.p>
    </motion.div>
  );
}

/** Quilled flowers unfurling out of the corners as the room turns pink. */
function CornerBlooms({ delay }: { delay: number }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* top-left cluster */}
      <QuillFlower unfurl delay={delay} size={150} color="#E58CA2" leaf rotate={-18} className="absolute -left-12 -top-10" />
      <QuillFlower unfurl delay={delay + 0.35} size={84} color="#C98D93" petals={7} rotate={22} className="absolute left-[4.5rem] -top-6" />
      <QuillFlower unfurl delay={delay + 0.55} size={62} color="#D9627F" petals={5} className="absolute -left-4 top-[6.2rem]" />
      {/* bottom-right cluster */}
      <QuillFlower unfurl delay={delay + 0.2} size={168} color="#E58CA2" leaf petals={7} rotate={160} className="absolute -bottom-14 -right-14" />
      <QuillFlower unfurl delay={delay + 0.5} size={92} color="#D9627F" rotate={40} className="absolute -bottom-8 right-[5.2rem]" />
      <QuillFlower unfurl delay={delay + 0.7} size={66} color="#C98D93" petals={5} rotate={-30} className="absolute bottom-[7rem] -right-5" />
      {/* quiet echoes */}
      <QuillFlower unfurl delay={delay + 0.9} size={58} color="#C98D93" petals={5} rotate={12} className="absolute -bottom-5 -left-4 opacity-80" />
      <QuillFlower unfurl delay={delay + 1} size={46} color="#E58CA2" petals={6} className="absolute bottom-10 left-9 opacity-70" />
    </div>
  );
}

export default function Dates() {
  const { next } = useExperience();
  const reduced = useReducedMotion();
  // the painted corner flowers only stand in when the photographed bloom is missing
  const bloomOk = useImageOk(assets.bloom.image);
  const [phase, setPhase] = useState<Phase>(0);
  /** true when the whole cinematic was skipped (no long transition was shown) */
  const [direct, setDirect] = useState(false);
  /** true when she tapped her way out of the transition before it had finished */
  const [rushed, setRushed] = useState(false);
  const mountedAt = useRef(0);

  useEffect(() => {
    mountedAt.current = performance.now();
  }, []);

  // each phase advances by itself after a comfortable beat
  useEffect(() => {
    const hold = (reduced ? HOLD_REDUCED : HOLD)[phase];
    if (!hold) return;
    const id = window.setTimeout(() => setPhase((p) => (p === phase ? ((phase + 1) as Phase) : p)), hold);
    return () => window.clearTimeout(id);
  }, [phase, reduced]);

  // sound + the ambient world follow the story
  useEffect(() => {
    if (phase === 1 || phase === 2) chime();
    if (phase === 3) shimmer();
    if (phase < 3) return;
    const id = window.setTimeout(() => setWorld("royal"), phase === 3 ? 900 : 0);
    return () => window.clearTimeout(id);
  }, [phase]);

  const advance = useCallback(() => {
    if (performance.now() - mountedAt.current < 400) return;
    setPhase((p) => {
      if (p === 3) setRushed(true);
      return p < 4 ? ((p + 1) as Phase) : p;
    });
  }, []);

  const skipAll = useCallback(() => {
    setDirect(true);
    setPhase(4);
  }, []);

  // keyboard: Enter / Space advance, Escape skips
  useEffect(() => {
    if (phase >= 4) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("button")) return;
      if (e.key === "Enter" || e.key === " ") advance();
      else if (e.key === "Escape") skipAll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, advance, skipAll]);

  const warm = phase >= 3;
  const final = phase === 4;
  // when the cinematic is skipped the room still needs a moment to turn light before ink appears
  const reveal = useReveal(FINAL_STEPS, {
    active: final,
    delay: direct || rushed || reduced ? 0.8 : 0.35,
    stagger: 1.25,
    pauses: FINAL_PAUSES,
  });
  const birthdayShown = reveal.shown >= BIRTHDAY_STEP;

  useEffect(() => {
    if (birthdayShown) success();
  }, [birthdayShown]);

  // layer timing: the long cinematic in phase 3, a quick settle when skipped
  const slow = phase === 3 && !reduced;
  const roseT = slow ? { duration: 1.5, ease: EASE } : { duration: 0.45 };
  const lightT = slow ? { duration: 1.9, delay: 0.95, ease: EASE } : { duration: 0.6 };

  return (
    <section
      className="chapter items-center text-center"
      onClick={phase < 4 ? advance : undefined}
      style={{ color: warm ? "var(--color-ink)" : "#f3e7d6" }}
    >
      {/* ── World A: the midnight chamber ── */}
      <Backdrop fallbackClassName="bg-midnight" />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 42% at 50% 44%, rgba(133,12,48,0.5), transparent 72%), radial-gradient(120% 60% at 50% 110%, rgba(11,7,14,0.9), transparent 60%)",
        }}
      />

      {/* ── the warming: ruby → rose, blooming from the centre ── */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(95% 62% at 50% 44%, #f9cfd6 0%, #f0a3b4 26%, #cf4a6e 52%, #850c30 76%, #3a0f22 100%)",
        }}
        initial={false}
        animate={{ opacity: final ? 1 : warm ? 0.999 : 0 }}
        transition={roseT}
      />

      {/* ── World B: Lana's royal universe ── */}
      <motion.div className="absolute inset-0" initial={false} animate={{ opacity: final ? 1 : warm ? 0.999 : 0 }} transition={lightT}>
        <Backdrop
          image={assets.bloom.image}
          video={assets.bloom.video}
          active={final}
          fallbackClassName="bg-royal"
          overlay="bg-[radial-gradient(105%_58%_at_50%_46%,rgba(255,248,240,0.94),rgba(255,248,240,0.74)_55%,rgba(255,248,240,0.12)_100%)]"
        />
        {/* golden light from above */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[55%] animate-slow-glow"
          style={{ background: "radial-gradient(70% 70% at 50% 0%, rgba(240,220,180,0.55), transparent 70%)" }}
        />
      </motion.div>

      {/* the burst of golden light that carries the change */}
      {phase === 3 && !reduced && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[44%] h-[70vw] max-h-[340px] w-[70vw] max-w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, rgba(255,248,240,0.95), rgba(240,220,180,0.7) 38%, rgba(244,183,195,0.3) 66%, transparent)",
          }}
          initial={{ opacity: 0, scale: 0.15 }}
          animate={{ opacity: [0, 0.95, 0.8, 0], scale: [0.15, 1.1, 2.3, 3.2] }}
          transition={{ duration: 2.7, times: [0, 0.2, 0.6, 1], ease: "easeOut" }}
        />
      )}

      {/* ── particles: gold dust in the dark, petals in the light ── */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        initial={false}
        animate={{ opacity: warm ? 0 : 1 }}
        transition={{ duration: 0.9 }}
      >
        {!final && <Particles variant="dust" count={30} />}
      </motion.div>
      {warm && bloomOk === false && <CornerBlooms delay={direct || reduced ? 0.35 : 1.25} />}
      {final && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 animate-fade-in">
          <Particles variant="petals" count={9} color="#EE9DB0" intensity={0.8} />
          <Particles variant="sparkle" count={10} color="#C9A465" intensity={0.7} />
        </div>
      )}
      {warm && !direct && !reduced && <CrystalBurst />}
      {birthdayShown && !reduced && <Confetti />}

      {/* ── the two dates ── */}
      <AnimatePresence>
        {phase < 3 && (
          <motion.div
            key="dates"
            className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 pb-[12dvh] pt-16"
            exit={{
              opacity: 0,
              scale: reduced ? 1 : 1.05,
              filter: reduced ? "blur(0px)" : "blur(8px)",
              transition: { duration: reduced ? 0.25 : 0.7, ease: EASE },
            }}
          >
            {phase <= 1 && (
              <div className="pointer-events-none absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2">
                <GhostGrid />
              </div>
            )}
            {phase >= 1 && (
              <div className="relative flex w-full flex-col items-center gap-9">
                <DateBlock date={story.dates.first.date} caption={story.dates.first.caption} />
                {phase >= 2 && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, scaleX: 0.4 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={{ duration: 1.2, ease: EASE }}
                    >
                      <GoldRule ornament="star" width={150} />
                    </motion.div>
                    <DateBlock date={story.dates.second.date} caption={story.dates.second.caption} />
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── tap hint + skip (dark phases only) ── */}
      {phase < 3 && (
        <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-1 pb-safe">
          {phase >= 1 && (
            <motion.p
              key={phase}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.75, 0.4, 0.75] }}
              transition={{ duration: 3.2, delay: 1.7, times: [0, 0.3, 0.65, 1], repeat: Infinity, repeatType: "mirror" }}
              className="label-caps text-gold"
            >
              {story.dates.tapHint}
            </motion.p>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              skipAll();
            }}
            className="label-caps flex min-h-[44px] min-w-[88px] items-center justify-center px-5 text-[0.625rem] text-[#f3e7d6]/55 active:text-[#f3e7d6]"
          >
            {SKIP_LABEL}
          </button>
        </div>
      )}

      {/* ── the birthday wish ── */}
      {final && (
        <div className="relative z-10 flex w-full flex-1 flex-col items-center">

          <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 py-6">
            <Reveal show={reveal.shown >= 1} fast={reveal.skipped}>
              <p className="font-display text-[1.4rem] italic leading-snug text-ink">{story.dates.lines[0]}</p>
            </Reveal>
            <Reveal show={reveal.shown >= 2} fast={reveal.skipped}>
              <p className="font-display text-[1.4rem] italic leading-snug text-ink">{story.dates.lines[1]}</p>
            </Reveal>
            <Reveal show={reveal.shown >= 3} fast={reveal.skipped} className="py-2">
              <GoldRule tone="ruby" ornament="heart" width={170} />
            </Reveal>
            <Reveal show={birthdayShown} fast={reveal.skipped} duration={1.5}>
              <h1
                className="headline px-1 pb-1 font-semibold text-ruby-foil animate-shimmer"
                style={{ fontSize: "clamp(2.9rem, 14.5vw, 3.9rem)", lineHeight: 1.02 }}
              >
                {story.dates.birthday}
              </h1>
            </Reveal>
            <Reveal show={reveal.shown >= 5} fast={reveal.skipped} duration={1.3}>
              <p lang="ru" className="script text-balance text-[1.8rem] text-ruby">
                {story.dates.russian}
              </p>
            </Reveal>
          </div>

          <motion.div
            initial={false}
            animate={{ opacity: reveal.done ? 1 : 0, y: reveal.done ? 0 : 10 }}
            transition={{ duration: 0.9, delay: reveal.done && !reveal.skipped ? 0.5 : 0, ease: EASE }}
            className="w-full"
            style={{ pointerEvents: reveal.done ? "auto" : "none" }}
          >
            <Button variant="ruby" full disabled={!reveal.done} onClick={() => next()}>
              {story.dates.cta}
            </Button>
          </motion.div>
        </div>
      )}
    </section>
  );
}
