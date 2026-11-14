"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useExperience } from "@/lib/store";
import { story } from "@/lib/story";
import { assets, preloadImage } from "@/lib/assets";
import { Backdrop, Button, GoldRule, Particles } from "@/components/ui";
import { CrystalField } from "./portal/CrystalField";
import { useSequence, VELVET_EASE } from "./portal/sequence";

/** absolute seconds: label · title · subtitle · small · ritual · date + CTA */
const TIMES = [0.15, 0.45, 0.85, 1.25, 1.6, 1.95] as const;

const CSS = `
@keyframes portal-sweep {
  0%, 18% { transform: translate3d(-75%, 0, 0) rotate(0.001deg); opacity: 0; }
  26% { opacity: 1; }
  58% { opacity: 1; }
  66%, 100% { transform: translate3d(75%, 0, 0) rotate(0.001deg); opacity: 0; }
}
.portal-sweep {
  background: linear-gradient(102deg, transparent 40%, rgba(255, 214, 224, 0.07) 46%, rgba(255, 236, 214, 0.2) 50%, rgba(255, 214, 224, 0.07) 54%, transparent 60%);
  mix-blend-mode: screen;
  animation: portal-sweep 8.5s cubic-bezier(0.45, 0, 0.55, 1) infinite;
  will-change: transform, opacity;
}
@media (prefers-reduced-motion: reduce) {
  .portal-sweep { animation: none; opacity: 0.5; transform: none; }
}
`;

function Reveal({
  show,
  fast,
  className,
  children,
}: {
  show: boolean;
  fast: boolean;
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
      transition={{ duration: fast || reduced ? 0.35 : 0.95, ease: VELVET_EASE }}
      aria-hidden={show ? undefined : true}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Portal() {
  const { next } = useExperience();
  const { step, skipped } = useSequence(TIMES);
  const [hasImage, setHasImage] = useState<boolean | null>(null);

  // keep the first paint light: the loop is only requested once the copy has landed
  const ready = step >= TIMES.length;

  useEffect(() => {
    let alive = true;
    preloadImage(assets.portal.image).then((ok) => {
      if (alive) setHasImage(ok);
    });
    return () => {
      alive = false;
    };
  }, []);


  return (
    <section className="chapter items-center text-center text-[#f3e7d6]">
      <style>{CSS}</style>
      <Backdrop
        image={assets.portal.image}
        video={ready ? assets.portal.video : undefined}
        fallbackClassName="bg-velvet"
        overlay="bg-[radial-gradient(60%_30%_at_50%_52%,rgba(11,7,14,0.62)_0%,rgba(11,7,14,0.4)_55%,transparent_100%),linear-gradient(180deg,rgba(11,7,14,0.72)_0%,rgba(11,7,14,0.18)_26%,rgba(11,7,14,0.3)_52%,rgba(11,7,14,0.92)_100%)]"
      />
      {hasImage === false && <CrystalField className="animate-fade-in" />}
      {/* soft ruby heart-glow behind the name */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[38%] h-[70vw] max-h-[340px] w-[120%] -translate-x-1/2 -translate-y-1/2 animate-slow-glow"
        style={{
          background: "radial-gradient(closest-side, rgba(179,18,63,0.42), rgba(133,12,48,0.16) 55%, transparent 80%)",
        }}
      />
      <div aria-hidden className="portal-sweep pointer-events-none absolute -inset-x-1/2 inset-y-0" />
      <Particles variant="dust" />

      <div className="relative z-10 flex w-full max-w-[26rem] flex-1 flex-col items-center">
        <Reveal show={step >= 1} fast={skipped} className="mt-[clamp(2.75rem,9dvh,5.5rem)] flex items-center gap-3">
          <span aria-hidden className="h-px w-6 bg-gradient-to-r from-transparent to-gold/70" />
          <p className="label-caps text-gold">{story.portal.label}</p>
          <span aria-hidden className="h-px w-6 bg-gradient-to-l from-transparent to-gold/70" />
        </Reveal>

        <div className="flex w-full flex-1 flex-col items-center justify-center py-6">
          <Reveal show={step >= 2} fast={skipped}>
            <h1 className="headline text-gold-foil animate-shimmer pb-1 text-[clamp(2.9rem,13.5vw,3.75rem)] font-medium">
              {story.portal.title}
            </h1>
          </Reveal>
          <Reveal show={step >= 3} fast={skipped} className="mt-2">
            <p className="font-display text-[clamp(1.45rem,6.4vw,1.75rem)] italic leading-tight text-[#f7ece0]">
              {story.portal.subtitle}
            </p>
          </Reveal>
          <Reveal show={step >= 4} fast={skipped} className="mt-[clamp(1.25rem,3.6dvh,2rem)] flex flex-col items-center">
            <GoldRule tone="gold" ornament="diamond" width={148} />
            <p className="mt-[clamp(1.1rem,3dvh,1.75rem)] max-w-[17.5rem] font-display text-[1.2rem] leading-snug text-[#f3e7d6]/90 [text-wrap:balance]">
              {story.portal.small}
            </p>
          </Reveal>
          <Reveal show={step >= 5} fast={skipped} className="mt-[clamp(0.9rem,2.4dvh,1.4rem)]">
            <p className="mx-auto max-w-[19rem] font-display text-[1.02rem] italic leading-[1.45] text-[#f3e7d6]/70 [text-wrap:pretty]">
              {story.portal.ritual}
            </p>
          </Reveal>
        </div>

        <Reveal show={ready} fast={skipped} className="flex w-full flex-col items-center gap-5 pb-2">
          <p
            className="font-display text-[0.95rem] tracking-[0.42em] text-gold/75"
            style={{ marginRight: "-0.42em", fontVariantNumeric: "lining-nums" }}
          >
            {story.portal.date}
          </p>
          <Button variant="gold" full className="max-w-[20rem]" disabled={!ready} onClick={() => next()}>
            {story.portal.cta}
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
