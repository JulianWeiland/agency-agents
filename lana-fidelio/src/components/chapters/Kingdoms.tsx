"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  Building2,
  Check,
  Footprints,
  Sparkles,
  Sunrise,
  Sunset,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { useExperience } from "@/lib/store";
import { kingdomCopy, story, type KingdomId } from "@/lib/story";
import { assets } from "@/lib/assets";
import { shimmer, success, tap } from "@/lib/audio";
import { Backdrop, Button, GoldRule, Particles, Sheet } from "@/components/ui";
import { KingdomArt } from "./kingdoms/KingdomArt";
import { WaxSeal } from "./decree/WaxSeal";

/* Copy that is not (yet) in lib/story — reported to the foundation owner. */
const INTRO = "Two kingdoms await. Only one will be ours first.";
const CHOSEN_BADGE = "Your chosen kingdom";
const SEALED_LABEL = "Sealed by royal decree";
const NUMERALS = ["I", "II"] as const;

const ICONS: Record<KingdomId, readonly [LucideIcon, LucideIcon, LucideIcon]> = {
  sea: [Footprints, Waves, Sunset],
  balance: [Building2, Sparkles, Sunrise],
};

const EASE = [0.22, 0.61, 0.36, 1] as const;
const ORDER = story.kingdoms.order;

interface Rect {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

/** photo/video over the painted fallback */
function KingdomMedia({ kingdom, active, mediaClassName }: { kingdom: KingdomId; active: boolean; mediaClassName?: string }) {
  return (
    <>
      <KingdomArt kingdom={kingdom} />
      <Backdrop
        image={assets[kingdom].image}
        video={assets[kingdom].video}
        active={active}
        fallbackClassName="bg-transparent"
        mediaClassName={mediaClassName}
      />
    </>
  );
}

export default function Kingdoms() {
  const { choice, choiceConfirmed, selectKingdom, confirmKingdom, next } = useExperience();
  const reduced = useReducedMotion();

  const sectionRef = useRef<HTMLElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const rafRef = useRef(0);
  const leftRef = useRef(false);
  const indexRef = useRef(Math.max(0, ORDER.indexOf(choice ?? "sea")));

  const [index, setIndex] = useState(() => Math.max(0, ORDER.indexOf(choice ?? "sea")));
  const [detail, setDetail] = useState<{ kingdom: KingdomId; from: Rect } | null>(null);
  const [asking, setAsking] = useState<KingdomId | null>(null);
  const [sealing, setSealing] = useState<KingdomId | null>(null);

  /* ── carousel ── */

  const scrollToCard = useCallback((i: number, smooth: boolean) => {
    const scroller = scrollerRef.current;
    const card = cardRefs.current[i];
    if (!scroller || !card) return;
    const left = card.offsetLeft - (scroller.clientWidth - card.clientWidth) / 2;
    try {
      scroller.scrollTo({ left, behavior: smooth ? "smooth" : "instant" });
    } catch {
      scroller.scrollLeft = left;
    }
  }, []);

  // restore the previously selected kingdom without animation
  useLayoutEffect(() => {
    const start = Math.max(0, ORDER.indexOf(choice ?? "sea"));
    if (start === 0) return;
    scrollToCard(start, false);
    // once more after the first layout/font pass has settled
    const raf = requestAnimationFrame(() => scrollToCard(start, false));
    const id = window.setTimeout(() => {
      if (indexRef.current === start) scrollToCard(start, false);
    }, 320);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(id);
    };
    // only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const onScroll = () => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const mid = scroller.scrollLeft + scroller.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const d = Math.abs(card.offsetLeft + card.clientWidth / 2 - mid);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      if (indexRef.current !== best) {
        indexRef.current = best;
        setIndex(best);
        selectKingdom(ORDER[best]);
      }
    });
  };

  /* ── detail ── */

  const openDetail = (i: number) => {
    if (sealing) return;
    if (i !== index) {
      scrollToCard(i, !reduced);
      return;
    }
    const section = sectionRef.current;
    const card = cardRefs.current[i];
    let from: Rect = { top: 120, left: 40, right: 40, bottom: 160 };
    if (section && card) {
      const s = section.getBoundingClientRect();
      const c = card.getBoundingClientRect();
      from = {
        top: Math.max(0, c.top - s.top),
        left: Math.max(0, c.left - s.left),
        right: Math.max(0, s.right - c.right),
        bottom: Math.max(0, s.bottom - c.bottom),
      };
    }
    selectKingdom(ORDER[i]);
    shimmer();
    setDetail({ kingdom: ORDER[i], from });
  };

  const closeDetail = useCallback(() => {
    setAsking(null);
    setDetail(null);
  }, []);

  useEffect(() => {
    if (!detail || asking || sealing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDetail();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detail, asking, sealing, closeDetail]);

  /* ── confirm + seal ── */

  const confirm = () => {
    const k = asking;
    if (!k || sealing) return;
    setAsking(null);
    setSealing(k);
    success();
    // local state is set synchronously; the POST is best-effort and never blocks the story
    void confirmKingdom(k).catch(() => {});
  };

  const leave = useCallback(() => {
    if (leftRef.current) return;
    leftRef.current = true;
    next();
  }, [next]);

  useEffect(() => {
    if (!sealing) return;
    const id = window.setTimeout(leave, reduced ? 1300 : 2700);
    return () => window.clearTimeout(id);
  }, [sealing, reduced, leave]);

  const detailCopy = detail ? kingdomCopy(detail.kingdom) : null;
  const DetailIcons = detail ? ICONS[detail.kingdom] : null;
  const sealedCopy = sealing ? kingdomCopy(sealing) : null;
  const overlayOpen = !!detail || !!sealing;

  return (
    <section
      ref={sectionRef}
      className="chapter h-[100dvh] min-h-[540px] !px-0 !pb-0 text-ink"
      aria-label={story.kingdoms.heading}
    >
      <style>{`.kingdom-scroller::-webkit-scrollbar{display:none}`}</style>
      <Backdrop image={assets.bloom.image} fallbackClassName="bg-royal" overlay="bg-softpink/70" />
      <Particles variant="petals" count={7} paused={overlayOpen} />

      {/* ── heading ── */}
      <motion.header
        className="relative z-10 flex shrink-0 flex-col items-center px-5 pt-10 text-center"
        initial={{ opacity: 0, y: reduced ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
      >
        <h1 className="headline whitespace-nowrap text-[min(2.05rem,8.4vw)] text-ruby">{story.kingdoms.heading}</h1>
        <GoldRule tone="gold" color="#A47E45" width={132} className="mt-2.5" />
        <p className="mt-2.5 font-display text-[1.04rem] italic leading-snug text-ink-soft [text-wrap:balance]">{INTRO}</p>
      </motion.header>

      {/* ── carousel ── */}
      <motion.div
        className="relative z-10 mt-4 flex min-h-0 flex-1 flex-col"
        initial={{ opacity: 0, y: reduced ? 0 : 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: EASE, delay: 0.35 }}
      >
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="kingdom-scroller flex min-h-0 flex-1 snap-x snap-mandatory items-stretch gap-3.5 overflow-x-auto overscroll-x-contain px-[10%] pb-5 pt-1"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
          role="group"
          aria-roledescription="carousel"
          aria-label={story.kingdoms.heading}
        >
          {ORDER.map((id, i) => {
            const k = kingdomCopy(id);
            const active = i === index;
            const chosen = choiceConfirmed && choice === id;
            return (
              <div
                key={id}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                onClick={() => openDetail(i)}
                className="relative flex w-[80%] shrink-0 cursor-pointer snap-center snap-always flex-col justify-end overflow-hidden rounded-[26px] text-ivory"
                style={{
                  transform: `scale(${active ? 1 : 0.955})`,
                  opacity: active ? 1 : 0.82,
                  transition: "transform 0.6s cubic-bezier(0.22,0.61,0.36,1), opacity 0.6s cubic-bezier(0.22,0.61,0.36,1)",
                  boxShadow:
                    "0 0 0 1px rgba(215,180,123,0.55), 0 0 0 5px rgba(255,248,240,0.55), 0 22px 44px -22px rgba(74,21,38,0.55)",
                }}
                role="group"
                aria-roledescription="slide"
                aria-label={`${k.name} — ${k.place}`}
              >
                <KingdomMedia kingdom={id} active={active && !overlayOpen} />
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(31,10,22,0.92) 0%, rgba(40,15,29,0.72) 30%, rgba(40,15,29,0.12) 58%, rgba(40,15,29,0.0) 72%, rgba(40,15,29,0.22) 100%)",
                  }}
                />
                <div aria-hidden="true" className="pointer-events-none absolute inset-[7px] rounded-[20px] border border-gold/35" />

                <div className="absolute inset-x-0 top-0 flex items-start justify-between px-5 pt-5">
                  <span className="label-caps !text-[0.5625rem] !tracking-[0.3em] text-ivory/85" style={{ textShadow: "0 1px 6px rgba(40,15,29,0.6)" }}>
                    {story.kingdoms.imageCaption}
                  </span>
                  {chosen && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ruby text-gold-light shadow-[0_0_0_1px_rgba(215,180,123,0.7)]" title={CHOSEN_BADGE}>
                      <Check size={14} strokeWidth={2} aria-hidden="true" />
                      <span className="sr-only">{CHOSEN_BADGE}</span>
                    </span>
                  )}
                </div>

                <div className="relative flex flex-col items-center px-5 pb-5 pt-10 text-center">
                  <span className="font-display text-[0.95rem] italic text-gold-light/90">{NUMERALS[i]}</span>
                  <h2 className="headline mt-1 text-[1.5rem] uppercase !leading-[1.12] tracking-[0.1em] text-ivory">{k.title}</h2>
                  <p className="label-caps mt-2 !mr-0 !text-[0.625rem] !tracking-[0.2em] text-gold-light">{k.place}</p>
                  <p className="mt-3 font-display text-[1.02rem] italic leading-snug text-ivory/90">{k.tagline}</p>
                  <Button
                    variant="gold"
                    size="sm"
                    full
                    className="mt-4"
                    tabIndex={active ? 0 : -1}
                    onClick={(e) => {
                      e.stopPropagation();
                      openDetail(i);
                    }}
                  >
                    {story.kingdoms.exploreCta}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* dots */}
        <div className="flex shrink-0 items-center justify-center pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {ORDER.map((id, i) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                tap();
                scrollToCard(i, !reduced);
              }}
              aria-label={kingdomCopy(id).name}
              aria-current={i === index ? "true" : undefined}
              className="flex h-11 w-11 items-center justify-center"
            >
              <span
                className="block h-[7px] rounded-full transition-all duration-500 ease-velvet"
                style={{
                  width: i === index ? 26 : 7,
                  background: i === index ? "#850c30" : "rgba(133,12,48,0.28)",
                }}
              />
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── detail view (expands out of the card) ── */}
      <AnimatePresence>
        {detail && detailCopy && DetailIcons && (
          <motion.div
            key={`detail-${detail.kingdom}`}
            className="absolute inset-0 z-30 flex flex-col bg-ivory text-ink"
            initial={
              reduced
                ? { opacity: 0 }
                : {
                    opacity: 0.4,
                    clipPath: `inset(${detail.from.top}px ${detail.from.right}px ${detail.from.bottom}px ${detail.from.left}px round 26px)`,
                  }
            }
            animate={reduced ? { opacity: 1 } : { opacity: 1, clipPath: "inset(0px 0px 0px 0px round 0px)" }}
            exit={
              reduced
                ? { opacity: 0 }
                : {
                    opacity: 0,
                    clipPath: `inset(${detail.from.top}px ${detail.from.right}px ${detail.from.bottom}px ${detail.from.left}px round 26px)`,
                  }
            }
            transition={{ duration: reduced ? 0.3 : 0.75, ease: EASE }}
            role="region"
            aria-label={detailCopy.name}
          >
            <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {/* hero */}
              <div className="relative h-[30dvh] min-h-[190px] w-full overflow-hidden">
                <KingdomMedia kingdom={detail.kingdom} active={!sealing} />
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(40,15,29,0.32) 0%, rgba(40,15,29,0) 26%, rgba(255,248,240,0) 62%, rgba(255,248,240,0.9) 92%, #fff8f0 100%)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    tap();
                    closeDetail();
                  }}
                  aria-label={story.kingdoms.back}
                  className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full border border-ivory/60 bg-burgundy/35 text-ivory backdrop-blur-sm"
                  style={{ top: "max(1rem, env(safe-area-inset-top))" }}
                >
                  <ArrowLeft size={19} strokeWidth={1.5} aria-hidden="true" />
                </button>
                <span
                  className="label-caps absolute bottom-[30%] right-5 !mr-0 !text-[0.5625rem] !tracking-[0.3em] text-ivory/90"
                  style={{ textShadow: "0 1px 6px rgba(40,15,29,0.65)" }}
                >
                  {story.kingdoms.imageCaption}
                </span>
              </div>

              {/* body */}
              <motion.div
                className="relative -mt-9 flex flex-col items-center px-7 pb-6 text-center"
                initial={{ opacity: 0, y: reduced ? 0 : 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE, delay: reduced ? 0 : 0.35 }}
              >
                <p className="label-caps text-gold-deep">{detailCopy.place}</p>
                <h2 className="headline mt-2.5 text-[1.9rem] uppercase !leading-[1.1] tracking-[0.08em] text-ruby">
                  {detailCopy.title}
                </h2>
                <GoldRule color="#A47E45" width={140} className="mt-3.5" />
                <p className="mt-3.5 max-w-[19.5rem] font-display text-[1.22rem] italic leading-[1.35] text-ink">
                  {detailCopy.tagline}
                </p>

                <ul className="mt-4 flex w-full max-w-[19rem] flex-col">
                  {detailCopy.highlights.map((h, i) => {
                    const Icon = DetailIcons[i];
                    return (
                      <li
                        key={h}
                        className={`flex items-center gap-4 py-2.5 text-left ${i > 0 ? "border-t border-gold/40" : ""}`}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/70 bg-softpink/60 text-gold-deep">
                          <Icon size={18} strokeWidth={1.25} aria-hidden="true" />
                        </span>
                        <span className="font-display text-[1.14rem] leading-snug text-ink">{h}</span>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            </div>

            {/* sticky actions */}
            <div
              className="relative shrink-0 px-6 pt-3"
              style={{
                paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
                background: "linear-gradient(to top, #fff8f0 70%, rgba(255,248,240,0))",
                boxShadow: "0 -1px 0 rgba(215,180,123,0.35)",
              }}
            >
              <Button variant="ruby" full disabled={!!sealing} onClick={() => setAsking(detail.kingdom)}>
                {story.kingdoms.chooseCta}
              </Button>
              <div className="mt-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    tap();
                    closeDetail();
                  }}
                  className="flex h-11 items-center justify-center px-4 text-ink-soft"
                >
                  <span className="label-caps !text-[0.625rem]">{story.kingdoms.back}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── confirm ── */}
      <Sheet
        open={!!asking && !sealing}
        onClose={() => setAsking(null)}
        title={story.kingdoms.confirm.title}
        description={
          asking ? (
            <>
              <span className="block font-display text-[1.2rem] italic leading-snug text-ruby">{kingdomCopy(asking).name}</span>
              <span className="label-caps mt-1.5 block !mr-0 !text-[0.5938rem] !tracking-[0.24em]">{kingdomCopy(asking).place}</span>
            </>
          ) : undefined
        }
      >
        <Button variant="ruby" full onClick={confirm}>
          {story.kingdoms.confirm.yes}
        </Button>
        <div className="text-ruby">
          <Button variant="ghost" full size="sm" onClick={() => setAsking(null)}>
            {story.kingdoms.confirm.no}
          </Button>
        </div>
      </Sheet>

      {/* ── sealing ── */}
      <AnimatePresence>
        {sealing && sealedCopy && (
          <motion.div
            key="sealing"
            className="absolute inset-0 z-40 flex flex-col items-center justify-center px-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
            onClick={leave}
            role="status"
            aria-live="polite"
          >
            <div className="bg-royal absolute inset-0" />
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{ background: "radial-gradient(60% 38% at 50% 44%, rgba(215,180,123,0.32), transparent 70%)" }}
            />
            <div className="relative flex flex-col items-center">
              <div className="relative">
                <motion.span
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 h-[190px] w-[190px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{ background: "radial-gradient(circle, rgba(215,180,123,0.55), rgba(215,180,123,0) 68%)" }}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={reduced ? { opacity: 0.7, scale: 1 } : { opacity: [0, 0.95, 0.55], scale: [0.6, 1.25, 1.1] }}
                  transition={{ duration: 1.5, ease: EASE, delay: reduced ? 0 : 0.55 }}
                />
                <motion.div
                  className="relative"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.55, rotate: -14 }}
                  animate={reduced ? { opacity: 1 } : { opacity: [0, 1, 1], scale: [1.55, 0.94, 1], rotate: [-14, -6, -6] }}
                  transition={{ duration: reduced ? 0.4 : 0.85, ease: EASE, delay: 0.15, times: reduced ? undefined : [0, 0.7, 1] }}
                >
                  <WaxSeal size={128} idSuffix="kingdoms" />
                </motion.div>
              </div>
              <motion.div
                className="mt-8 flex flex-col items-center"
                initial={{ opacity: 0, y: reduced ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE, delay: reduced ? 0.2 : 0.9 }}
              >
                <p className="label-caps text-gold-deep">{SEALED_LABEL}</p>
                <p className="headline mt-3 text-[2rem] text-ruby">{sealedCopy.name}</p>
                <p className="mt-1.5 font-display text-[1.1rem] italic text-ink-soft">{sealedCopy.place}</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
