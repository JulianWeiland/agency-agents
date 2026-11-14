"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useExperience } from "@/lib/store";
import { kingdomCopy, story } from "@/lib/story";
import { assets } from "@/lib/assets";
import { chime, shimmer, success } from "@/lib/audio";
import { Backdrop, Button, ChessQueen, GoldRule, Particles, QuillFlower, Sheet, Signature, Toast } from "@/components/ui";
import { WaxSeal } from "./decree/WaxSeal";

/* Copy that is not in lib/story — reported to the foundation owner. */
const SEAL_LABEL = "By royal decree";
const SEAL_HINT = "Tap to open";
const SCREENSHOT_FALLBACK = "Take a screenshot to keep it ♡";
const DELIVERED = "Your choice has been delivered to Julian.";
const DOWNLOADED = "Your decree has been saved ♡";
const PREVIEW_TITLE = "Your Royal Decree";
const PREVIEW_BODY = "Touch and hold the image to save it to your photos.";
const PREVIEW_SHARE = "Save or Share";
const PREVIEW_PREPARING = "Preparing your decree…";

const EASE = [0.22, 0.61, 0.36, 1] as const;

/** blush handmade paper in plain gradients only — renders identically in the exported PNG */
const PAPER_STYLE = {
  backgroundColor: "#fbe3e7",
  backgroundImage:
    "radial-gradient(120% 80% at 18% 0%, rgba(255,248,240,0.96), rgba(255,248,240,0) 58%), radial-gradient(100% 70% at 100% 100%, rgba(244,183,195,0.6), rgba(244,183,195,0) 62%)",
  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.6), 0 18px 50px -18px rgba(133,12,48,0.35)",
} as const;
const CARD_ID = "decree-card";

function isCoarsePointer(): boolean {
  try {
    return window.matchMedia("(pointer: coarse)").matches;
  } catch {
    return false;
  }
}

function isAbort(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { name?: string }).name === "AbortError";
}

/** Render #decree-card to a PNG blob (two passes: Safari needs a warm-up for fonts/images). */
async function renderCard(): Promise<Blob | null> {
  const node = document.getElementById(CARD_ID);
  if (!node) return null;
  const { toBlob } = await import("html-to-image");
  try {
    await document.fonts?.ready;
  } catch {
    /* ignore */
  }
  const ratio = Math.min(3, Math.max(2, Math.round(window.devicePixelRatio || 2)));
  const options = {
    pixelRatio: ratio,
    cacheBust: false,
    backgroundColor: "#fbe3e7",
    style: { transform: "none", margin: "0", borderRadius: "0", boxShadow: "none" },
  };
  await toBlob(node, options).catch(() => null);
  return toBlob(node, options);
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;font-size:16px";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <dt className="label-caps !text-[0.5625rem] !tracking-[0.3em] text-gold-deep">{label}</dt>
      <dd className="mt-[3px]">{children}</dd>
    </div>
  );
}

/** CSS/SVG stand-in for paper.webp: gold double border + quilled corners. */
function PaperFallback() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute inset-[9px] rounded-[3px] border border-gold-deep/70" />
      <div className="absolute inset-[13px] rounded-[2px] border border-gold/60" />
      {/* top-left bouquet */}
      <div className="absolute -left-[10px] -top-[10px]">
        <QuillFlower size={66} leaf rotate={-18} color="#EE9FB0" />
      </div>
      <div className="absolute left-[44px] top-[2px]">
        <QuillFlower size={30} petals={5} color="#F4B7C3" rotate={12} />
      </div>
      <div className="absolute left-[2px] top-[46px]">
        <QuillFlower size={26} petals={5} color="#F6C9D2" center="#C98D93" rotate={40} />
      </div>
      {/* bottom-right bouquet */}
      <div className="absolute -bottom-[10px] -right-[10px]">
        <QuillFlower size={66} leaf rotate={162} color="#EE9FB0" />
      </div>
      <div className="absolute bottom-[2px] right-[44px]">
        <QuillFlower size={30} petals={5} color="#F4B7C3" rotate={-20} />
      </div>
      <div className="absolute bottom-[46px] right-[2px]">
        <QuillFlower size={26} petals={5} color="#F6C9D2" center="#C98D93" rotate={8} />
      </div>
      {/* tiny gold dots, like the handmade card */}
      {[
        ["right-[26px]", "top-[26px]"],
        ["right-[40px]", "top-[21px]"],
        ["right-[22px]", "top-[41px]"],
        ["left-[26px]", "bottom-[26px]"],
        ["left-[40px]", "bottom-[21px]"],
        ["left-[22px]", "bottom-[41px]"],
      ].map(([x, y]) => (
        <span key={x + y} className={`absolute ${x} ${y} h-[4px] w-[4px] rounded-full bg-gold-deep/80`} />
      ))}
    </div>
  );
}

export default function Decree() {
  const { choice, choiceConfirmed, choiceSynced, go, next } = useExperience();
  const reduced = useReducedMotion();

  const [phase, setPhase] = useState<"seal" | "card">("seal");
  const [paper, setPaper] = useState<"loading" | "ready" | "error">("loading");
  const [paperFit, setPaperFit] = useState<"cover" | "fill">("cover");
  const [egg, setEgg] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ url: string; blob: Blob; shareable: boolean } | null>(null);

  const cacheRef = useRef<{ key: string; blob: Blob } | null>(null);
  const pendingRef = useRef<{ key: string; promise: Promise<Blob | null> } | null>(null);
  const paperRef = useRef<HTMLImageElement | null>(null);

  const kingdom = choice ? kingdomCopy(choice) : null;
  const cacheKey = `${choice ?? "none"}|${egg ? 1 : 0}|${paper}`;

  // no choice (should never happen) → back to the kingdoms, never a dead end
  useEffect(() => {
    if (!choice || !choiceConfirmed) go("kingdoms");
  }, [choice, choiceConfirmed, go]);

  /* ── seal intro ── */

  const openCard = useCallback(() => {
    if (phase === "seal") shimmer();
    setPhase("card");
  }, [phase]);

  useEffect(() => {
    if (phase !== "seal") return;
    chime();
    const id = window.setTimeout(openCard, reduced ? 900 : 1900);
    return () => window.clearTimeout(id);
  }, [phase, reduced, openCard]);

  /* ── paper texture ── */

  const onPaperLoad = (img: HTMLImageElement) => {
    if (!img.naturalWidth) {
      setPaper("error");
      return;
    }
    const card = document.getElementById(CARD_ID);
    if (card && card.clientHeight > 0) {
      const cardAspect = card.clientWidth / card.clientHeight;
      const imgAspect = img.naturalWidth / img.naturalHeight;
      // keep the paper's own floral corners visible when the proportions differ
      setPaperFit(Math.abs(imgAspect / cardAspect - 1) > 0.08 ? "fill" : "cover");
    }
    setPaper("ready");
  };

  useEffect(() => {
    if (phase !== "card") return;
    const img = paperRef.current;
    if (!img || !img.complete) return;
    const id = requestAnimationFrame(() => onPaperLoad(img));
    return () => cancelAnimationFrame(id);
  }, [phase]);

  /* ── image rendering (pre-rendered so the iOS share sheet opens inside the tap gesture) ── */

  const ensureBlob = useCallback(
    (key: string): Promise<Blob | null> => {
      if (cacheRef.current?.key === key) return Promise.resolve(cacheRef.current.blob);
      if (pendingRef.current?.key === key) return pendingRef.current.promise;
      const promise = renderCard()
        .then((blob) => {
          if (blob && blob.size > 2000) {
            cacheRef.current = { key, blob };
            return blob;
          }
          return null;
        })
        .catch(() => null)
        .finally(() => {
          if (pendingRef.current?.key === key) pendingRef.current = null;
        });
      pendingRef.current = { key, promise };
      return promise;
    },
    [],
  );

  useEffect(() => {
    if (phase !== "card" || !choice || paper === "loading") return;
    const id = window.setTimeout(() => void ensureBlob(cacheKey), reduced ? 900 : 3400);
    return () => window.clearTimeout(id);
  }, [phase, choice, paper, cacheKey, reduced, ensureBlob]);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview.url);
    },
    [preview],
  );

  const shareFile = async (blob: Blob): Promise<"shared" | "cancelled" | "unavailable"> => {
    try {
      const file = new File([blob], story.decree.fileName, { type: "image/png" });
      if (!navigator.share || !navigator.canShare?.({ files: [file] })) return "unavailable";
      await navigator.share({ files: [file], title: story.decree.shareTitle });
      return "shared";
    } catch (err) {
      return isAbort(err) ? "cancelled" : "unavailable";
    }
  };

  const onSave = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await ensureBlob(cacheKey);
      if (!blob) throw new Error("render failed");

      if (isCoarsePointer()) {
        const result = await shareFile(blob);
        if (result !== "unavailable") return;
        // share sheet refused (e.g. the gesture expired while rendering) → long-press preview
        setPreview({ url: URL.createObjectURL(blob), blob, shareable: typeof navigator.share === "function" });
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = story.decree.fileName;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      success();
      setToast(DOWNLOADED);
    } catch {
      setToast(SCREENSHOT_FALLBACK);
    } finally {
      setBusy(false);
    }
  };

  const onShare = async () => {
    if (!kingdom) return;
    const text = story.decree.shareText(kingdom);
    if (typeof navigator.share === "function" && isCoarsePointer()) {
      try {
        await navigator.share({ title: story.decree.shareTitle, text });
        return;
      } catch (err) {
        if (isAbort(err)) return;
      }
    }
    const ok = await copyText(text);
    setToast(ok ? story.decree.copied : SCREENSHOT_FALLBACK);
  };

  if (!choice || !kingdom) {
    return (
      <section className="chapter">
        <Backdrop fallbackClassName="bg-royal" />
      </section>
    );
  }

  const f = story.decree.fields;
  const item = (i: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 6 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, ease: EASE, delay: 0.75 + i * 0.13 },
        };

  return (
    <section className="chapter items-center text-ink" aria-label={story.decree.title}>
      <Backdrop image={assets.bloom.image} fallbackClassName="bg-royal" overlay="bg-softpink/75" />
      <Particles variant="sparkle" count={12} color="#D7B47B" paused={phase === "seal"} />

      <AnimatePresence mode="wait">
        {phase === "seal" ? (
          /* ── the wax seal ── */
          <motion.button
            key="seal"
            type="button"
            onClick={openCard}
            aria-label={SEAL_HINT}
            className="relative z-10 flex w-full flex-1 flex-col items-center justify-center outline-none"
            exit={{ opacity: 0, scale: reduced ? 1 : 1.06 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <span className="relative block">
              <motion.span
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 block h-[230px] w-[230px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(215,180,123,0.6), rgba(215,180,123,0) 66%)" }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={reduced ? { opacity: 0.7, scale: 1 } : { opacity: [0, 1, 0.6], scale: [0.5, 1.3, 1.12] }}
                transition={{ duration: 1.4, ease: EASE, delay: reduced ? 0 : 0.6 }}
              />
              <motion.span
                className="relative block"
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.6, rotate: -16 }}
                animate={reduced ? { opacity: 1 } : { opacity: [0, 1, 1], scale: [1.6, 0.93, 1], rotate: [-16, -7, -7] }}
                transition={{ duration: reduced ? 0.4 : 0.9, ease: EASE, delay: 0.15, times: reduced ? undefined : [0, 0.72, 1] }}
              >
                <WaxSeal size={148} idSuffix="decree" />
              </motion.span>
            </span>
            <motion.span
              className="mt-9 flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: reduced ? 0.1 : 0.85 }}
            >
              <span className="label-caps text-ruby">{SEAL_LABEL}</span>
              <span className="mt-3 font-display text-[1rem] italic text-ink-soft">{SEAL_HINT}</span>
            </motion.span>
          </motion.button>
        ) : (
          /* ── the certificate ── */
          <motion.div
            key="card"
            className="relative z-10 flex w-full flex-1 flex-col items-center pt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="my-auto flex w-full flex-col items-center" style={{ perspective: 1100 }}>
              <motion.div
                id={CARD_ID}
                className="relative w-full max-w-[342px] overflow-hidden rounded-[6px] px-[26px] pb-[23px] pt-[26px] text-center text-ink"
                style={{ transformOrigin: "50% 0%", ...PAPER_STYLE }}
                initial={reduced ? { opacity: 0 } : { opacity: 0, rotateX: -62, y: -8 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, rotateX: 0, y: 0 }}
                transition={{ duration: reduced ? 0.4 : 1.15, ease: EASE }}
              >
                {paper !== "error" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    ref={paperRef}
                    src={assets.paper.image}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    decoding="async"
                    onLoad={(e) => onPaperLoad(e.currentTarget)}
                    onError={() => setPaper("error")}
                    className={`pointer-events-none absolute inset-0 h-full w-full scale-[1.16] ${
                      paperFit === "fill" ? "object-fill" : "object-cover"
                    } ${paper === "ready" ? "opacity-100" : "opacity-0"}`}
                  />
                )}
                {paper !== "ready" && <PaperFallback />}

                <div className="relative flex flex-col items-center">
                  <motion.div {...item(0)} className="flex flex-col items-center">
                    <svg width="26" height="18" viewBox="0 0 26 18" fill="none" aria-hidden="true" className="text-gold-deep">
                      <path
                        d="M3.5 14.5 1.6 4.8l5.6 4.4L13 1.6l5.8 7.6 5.6-4.4-1.9 9.7Z"
                        stroke="currentColor"
                        strokeWidth="1.1"
                        strokeLinejoin="round"
                        fill="rgba(215,180,123,0.28)"
                      />
                      <path d="M3.8 16.8h18.4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                    </svg>
                    <h1 className="label-caps mt-2 whitespace-nowrap !text-[0.625rem] !leading-[1.5] !tracking-[0.24em] !mr-[-0.24em] text-ruby">
                      {story.decree.title}
                    </h1>
                    <GoldRule color="#A47E45" width={128} className="mt-2" />
                  </motion.div>

                  <dl className="mt-2.5 flex w-full flex-col items-center gap-[8px]">
                    <motion.div {...item(1)}>
                      <Field label={f.presentedTo.label}>
                        <span className="script block text-[2.15rem] !leading-[1.08] text-ruby">{f.presentedTo.value}</span>
                      </Field>
                    </motion.div>
                    <motion.div {...item(2)}>
                      <Field label={f.occasion.label}>
                        <span className="font-display text-[1.2rem] font-medium leading-tight text-ink">{f.occasion.value}</span>
                      </Field>
                    </motion.div>
                    <motion.div {...item(3)}>
                      <Field label={f.gift.label}>
                        <span className="font-display text-[1.2rem] font-medium leading-tight text-ink">{f.gift.value}</span>
                      </Field>
                    </motion.div>
                    <motion.div {...item(4)}>
                      <Field label={f.destination.label}>
                        <span className="block font-display text-[1.32rem] font-semibold leading-tight text-ruby">
                          {kingdom.name}
                          <span className="sr-only"> — </span>
                        </span>
                        <span className="mt-px block font-display text-[1.02rem] italic leading-tight text-ink">
                          {kingdom.place}
                        </span>
                      </Field>
                    </motion.div>

                    <motion.div {...item(5)} className="mt-0.5 grid w-full grid-cols-2 items-start">
                      <Field label={f.dates.label} className="px-1">
                        <span className="block max-w-[7.5rem] font-display text-[1.06rem] font-medium leading-[1.15] text-ink">
                          {f.dates.value}
                        </span>
                      </Field>
                      <Field label={f.from.label} className="border-l border-gold-deep/40 px-1">
                        <span className="block font-display text-[1.06rem] font-medium leading-[1.15] text-ink">{f.from.value}</span>
                        <Signature tone="ruby" width={84} write={!reduced} delay={1.9} className="mx-auto mt-0.5 block" />
                      </Field>
                    </motion.div>
                  </dl>

                  <motion.div {...item(6)} className="mt-2.5 flex flex-col items-center">
                    <GoldRule color="#A47E45" width={96} ornament="heart" />
                    <p className="mt-2 max-w-[15.5rem] translate-x-[10px] font-display text-[1.08rem] italic leading-[1.28] text-ink [text-wrap:balance]">
                      {story.decree.line}
                    </p>
                    <p className="mt-1.5 max-w-[13rem] translate-x-[22px] font-display text-[0.9rem] italic leading-[1.25] text-ink-soft [text-wrap:balance]">
                      {story.decree.forecast}
                    </p>
                  </motion.div>

                  <motion.div {...item(7)} className="-mb-1 flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (!egg) chime();
                        setEgg((v) => !v);
                      }}
                      aria-expanded={egg}
                      aria-label={story.decree.easterEggLabel}
                      className="-my-2 flex h-11 w-11 items-center justify-center text-gold-deep"
                    >
                      <ChessQueen size={15} />
                    </button>
                    <p
                      aria-live="polite"
                      className={`h-[16px] translate-x-[26px] whitespace-nowrap font-display text-[0.84rem] italic leading-[16px] text-ruby transition-opacity duration-700 ease-velvet ${
                        egg ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      {egg ? story.decree.easterEgg : " "}
                    </p>
                  </motion.div>
                </div>
              </motion.div>

              {/* actions */}
              <motion.div
                className="mt-4 flex w-full max-w-[342px] flex-col gap-2.5"
                initial={{ opacity: 0, y: reduced ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE, delay: reduced ? 0.2 : 1.5 }}
              >
                <div className="grid grid-cols-2 gap-2.5 text-ruby">
                  <Button variant="ghost" size="sm" full onClick={onSave} aria-busy={busy} className="whitespace-nowrap !px-1 !text-[0.76rem] !tracking-[0.07em]">
                    {story.decree.saveCta}
                  </Button>
                  <Button variant="ghost" size="sm" full onClick={onShare} className="whitespace-nowrap !px-1 !text-[0.76rem] !tracking-[0.07em]">
                    {story.decree.shareCta}
                  </Button>
                </div>
                {choiceSynced && (
                  <p className="text-center font-display text-[0.95rem] italic leading-tight text-ink-soft" role="status">
                    {DELIVERED}
                  </p>
                )}
                <Button variant="ruby" full onClick={() => next()}>
                  {story.decree.continueCta}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* long-press preview — the fallback when the share sheet cannot open */}
      <Sheet
        open={!!preview}
        onClose={() => setPreview(null)}
        title={PREVIEW_TITLE}
        description={PREVIEW_BODY}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview.url}
            alt={story.decree.title}
            className="mx-auto max-h-[46dvh] w-auto rounded-[4px] shadow-[0_10px_30px_-12px_rgba(74,21,38,0.5)]"
            style={{ WebkitTouchCallout: "default", userSelect: "auto" }}
          />
        ) : (
          <p className="text-center font-display italic text-ink-soft">{PREVIEW_PREPARING}</p>
        )}
        {preview?.shareable && (
          <Button
            variant="ruby"
            full
            onClick={async () => {
              const result = await shareFile(preview.blob);
              if (result === "shared") setPreview(null);
            }}
          >
            {PREVIEW_SHARE}
          </Button>
        )}
        <div className="text-ruby">
          <Button variant="ghost" size="sm" full onClick={() => setPreview(null)}>
            {story.common.close}
          </Button>
        </div>
      </Sheet>

      <Toast message={toast} onClear={() => setToast(null)} />
    </section>
  );
}
