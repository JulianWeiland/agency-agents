"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useExperience } from "@/lib/store";
import { story } from "@/lib/story";
import { assets, preloadImage } from "@/lib/assets";
import { error as errorSound, shimmer, success as successSound } from "@/lib/audio";
import { Backdrop, Button, FadeLines, GoldRule, Particles } from "@/components/ui";
import { GoldenMask } from "./fidelio/GoldenMask";
import { useSequence, VELVET_EASE } from "./portal/sequence";

type Phase = "ask" | "closing" | "open";

/** absolute seconds: mask · line 1 · line 2 · the question · the form */
const TIMES = [0.1, 0.7, 1.45, 2.2, 2.75] as const;
const CURTAIN_EASE = [0.65, 0, 0.35, 1] as const;

const CSS = `
.fid-curtain {
  background:
    linear-gradient(180deg, rgba(5,2,6,0.72) 0%, rgba(5,2,6,0.08) 22%, rgba(5,2,6,0.12) 62%, rgba(5,2,6,0.78) 100%),
    repeating-linear-gradient(90deg, #1b0610 0px, #3d0819 9px, #6a0a27 19px, #8a0e33 25px, #5a0820 33px, #2a0713 44px, #1b0610 52px);
}
.fid-curtain-l { box-shadow: inset -14px 0 22px -10px rgba(0,0,0,0.75), 10px 0 40px rgba(0,0,0,0.55); }
.fid-curtain-r { box-shadow: inset 14px 0 22px -10px rgba(0,0,0,0.75), -10px 0 40px rgba(0,0,0,0.55); }
.fid-input::placeholder { color: rgba(215,180,123,0.42); letter-spacing: 0.3em; }
.fid-input { caret-color: #f0dcb4; }
.fid-flame {
  background: radial-gradient(ellipse at 50% 78%, #fff6da 0%, #ffd58a 32%, rgba(255,160,70,0.75) 58%, rgba(255,120,60,0) 76%);
  border-radius: 50% 50% 50% 50% / 62% 62% 38% 38%;
  transform-origin: 50% 100%;
}
`;

function Candle({ side }: { side: "left" | "right" }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute bottom-0 ${side === "left" ? "left-[7%]" : "right-[7%]"} flex flex-col items-center`}
    >
      <div
        className="absolute -top-16 h-44 w-44 animate-flicker rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(255,190,110,0.3), rgba(215,140,80,0.1) 55%, transparent 78%)" }}
      />
      <div className="fid-flame h-[22px] w-[9px] animate-flicker" style={{ animationDuration: side === "left" ? "2.7s" : "3.4s" }} />
      <div className="-mt-px h-[3px] w-px bg-[#2a1a12]" />
      <div
        className="w-[9px] rounded-t-[2px]"
        style={{
          height: side === "left" ? "clamp(54px,11dvh,96px)" : "clamp(40px,8dvh,70px)",
          background: "linear-gradient(90deg, #b9a58a 0%, #f3e7d6 40%, #cdb99c 70%, #7d6a55 100%)",
          opacity: 0.82,
        }}
      />
    </div>
  );
}

export default function Fidelio() {
  const { passwordAccepted, acceptPassword, next } = useExperience();
  const reduced = useReducedMotion();
  /** already unlocked when we arrived (refresh / replay) → straight to the welcome state */
  const [replay] = useState(passwordAccepted);
  const [phase, setPhase] = useState<Phase>(replay ? "open" : "ask");
  const { step, skipped } = useSequence(TIMES, replay);

  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(0);
  const [hint, setHint] = useState(0);
  const [revealing, setRevealing] = useState(false);
  const [welcomed, setWelcomed] = useState(false);
  const [hasChamber, setHasChamber] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const leftRef = useRef(false);

  useEffect(() => {
    let alive = true;
    preloadImage(assets.chamber.image).then((ok) => {
      if (alive) setHasChamber(ok);
    });
    return () => {
      alive = false;
    };
  }, []);

  const succeed = useCallback(() => {
    inputRef.current?.blur();
    acceptPassword();
    successSound();
    setPhase("closing");
  }, [acceptPassword]);

  // the curtain falls, then rises on the welcome
  useEffect(() => {
    if (phase !== "closing") return;
    const id = window.setTimeout(() => setPhase("open"), reduced ? 350 : 1050);
    return () => window.clearTimeout(id);
  }, [phase, reduced]);

  const leave = useCallback(() => {
    if (leftRef.current) return;
    leftRef.current = true;
    next();
  }, [next]);

  // first time through: drift on to the stars after a breath
  useEffect(() => {
    if (!welcomed || replay) return;
    const id = window.setTimeout(leave, 2600);
    return () => window.clearTimeout(id);
  }, [welcomed, replay, leave]);

  // "Reveal the password": the word writes itself, then opens the door
  useEffect(() => {
    if (!revealing) return;
    const word = story.meta.password;
    let i = 0;
    let done: number | undefined;
    const id = window.setInterval(() => {
      i += 1;
      setValue(word.slice(0, i));
      if (i >= word.length) {
        window.clearInterval(id);
        done = window.setTimeout(succeed, 520);
      }
    }, 110);
    return () => {
      window.clearInterval(id);
      if (done) window.clearTimeout(done);
    };
  }, [revealing, succeed]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (phase !== "ask" || revealing) return;
    const guess = value.trim().toUpperCase();
    if (!guess) {
      inputRef.current?.focus();
      return;
    }
    if (guess === story.meta.password) {
      succeed();
      return;
    }
    errorSound();
    setWrong((w) => w + 1);
    inputRef.current?.select();
  };

  const onHint = () => {
    if (hint >= story.fidelio.hints.length) {
      setValue("");
      setRevealing(true);
      return;
    }
    shimmer();
    setHint((h) => h + 1);
  };

  const wrongMessage =
    wrong === 0
      ? null
      : wrong > story.fidelio.wrong.length
        ? story.fidelio.wrongMany
        : story.fidelio.wrong[(wrong - 1) % story.fidelio.wrong.length];
  const hintText = hint > 0 ? story.fidelio.hints[hint - 1] : null;
  const lastHint = hint >= story.fidelio.hints.length;
  const asking = phase === "ask";
  const formReady = step >= TIMES.length;
  const fade = (on: boolean) => ({
    initial: false as const,
    animate: on ? { opacity: 1, y: 0 } : { opacity: 0, y: reduced ? 0 : 10 },
    transition: { duration: skipped || reduced ? 0.35 : 0.95, ease: VELVET_EASE },
  });
  const sliver = "88%";

  return (
    <section className="chapter items-center text-center text-[#f3e7d6]">
      <style>{CSS}</style>
      <Backdrop
        image={assets.chamber.image}
        video={assets.chamber.video}
        fallbackClassName="bg-midnight"
        overlay="bg-[linear-gradient(180deg,rgba(11,7,14,0.7)_0%,rgba(11,7,14,0.56)_40%,rgba(11,7,14,0.8)_100%)]"
      />
      {/* candlelight */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-[46%] h-80 w-80 animate-flicker rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(255,176,96,0.2), rgba(215,140,80,0.06) 60%, transparent 80%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-[58%] h-80 w-80 animate-flicker rounded-full"
        style={{
          background: "radial-gradient(closest-side, rgba(255,176,96,0.17), rgba(215,140,80,0.05) 60%, transparent 80%)",
          animationDuration: "4.1s",
          animationDelay: "-1.3s",
        }}
      />
      {hasChamber === false && (
        <div className="absolute inset-0 animate-fade-in">
          <Candle side="left" />
          <Candle side="right" />
        </div>
      )}
      <Particles variant="dust" count={22} />

      {/* what waits behind the curtain */}
      <motion.div
        aria-hidden
        initial={false}
        animate={{ opacity: asking ? 0 : 1 }}
        transition={{ duration: 0.5, delay: phase === "closing" ? 0.45 : 0 }}
        className="pointer-events-none absolute inset-0 z-[15]"
        style={{
          background:
            "radial-gradient(70% 42% at 50% 40%, rgba(215,180,123,0.3), rgba(133,12,48,0.24) 48%, transparent 76%), linear-gradient(180deg, #0b070e 0%, #160f1c 55%, #1d0b17 100%)",
        }}
      >
        {!asking && <Particles variant="sparkle" count={26} />}
      </motion.div>

      {/* velvet curtains */}
      <motion.div
        aria-hidden
        initial={false}
        animate={{ x: phase === "closing" ? "0%" : `-${sliver}` }}
        transition={{ duration: reduced ? 0.3 : phase === "closing" ? 0.8 : 1.7, ease: CURTAIN_EASE }}
        className="fid-curtain fid-curtain-l pointer-events-none absolute inset-y-0 left-0 z-20 w-[51%]"
      >
        <span className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-gold/60 to-transparent" />
      </motion.div>
      <motion.div
        aria-hidden
        initial={false}
        animate={{ x: phase === "closing" ? "0%" : sliver }}
        transition={{ duration: reduced ? 0.3 : phase === "closing" ? 0.8 : 1.7, ease: CURTAIN_EASE }}
        className="fid-curtain fid-curtain-r pointer-events-none absolute inset-y-0 right-0 z-20 w-[51%]"
      >
        <span className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-gold/60 to-transparent" />
      </motion.div>

      <div className="relative z-30 flex w-full max-w-[20rem] flex-1 flex-col items-center">
        {/* the mask */}
        <motion.div
          initial={false}
          animate={
            step >= 1
              ? { opacity: 1, scale: asking ? 1 : 1.06, y: 0, filter: "brightness(1) blur(0px)" }
              : { opacity: 0, scale: 0.9, y: reduced ? 0 : 14, filter: "brightness(0.35) blur(6px)" }
          }
          transition={{ duration: skipped || reduced ? 0.4 : asking ? 2.2 : 1.1, ease: VELVET_EASE }}
          className="relative mt-[clamp(0.5rem,3.5dvh,2.5rem)] w-[min(47vw,23dvh,12.5rem)]"
        >
          <motion.div
            aria-hidden
            initial={false}
            animate={{ opacity: asking ? 0.5 : 1, scale: asking ? 1 : 1.35 }}
            transition={{ duration: 1.2, ease: VELVET_EASE }}
            className="absolute -inset-x-[45%] -inset-y-[70%] rounded-full"
            style={{
              background: asking
                ? "radial-gradient(closest-side, rgba(215,180,123,0.26), rgba(133,12,48,0.12) 55%, transparent 78%)"
                : "radial-gradient(closest-side, rgba(251,236,203,0.6), rgba(215,180,123,0.26) 45%, transparent 76%)",
            }}
          />
          <div className="animate-float" style={{ animationDuration: "8s" }}>
            <GoldenMask
              className={
                asking
                  ? "drop-shadow-[0_14px_22px_rgba(0,0,0,0.6)]"
                  : "drop-shadow-[0_0_26px_rgba(251,236,203,0.75)] transition-[filter] duration-1000"
              }
            />
          </div>
        </motion.div>

        <AnimatePresence mode="wait" initial={false}>
          {asking ? (
            <motion.div
              key="ask"
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
              className="flex w-full flex-1 flex-col items-center"
            >
              <div className="mt-[clamp(0.9rem,2.6dvh,1.75rem)] flex flex-col items-center gap-[0.3rem]">
                <motion.p {...fade(step >= 2)} className="font-display text-[1.22rem] italic leading-snug text-[#f3e7d6]/85">
                  {story.fidelio.lines[0]}
                </motion.p>
                <motion.p {...fade(step >= 3)} className="font-display text-[1.22rem] italic leading-snug text-[#f3e7d6]/85">
                  {story.fidelio.lines[1]}
                </motion.p>
                <motion.h1
                  {...fade(step >= 4)}
                  className="headline text-gold-foil animate-shimmer mt-[clamp(0.35rem,1.2dvh,0.8rem)] whitespace-nowrap pb-0.5 text-[clamp(1.7rem,7.7vw,2.1rem)]"
                >
                  {story.fidelio.lines[2]}
                </motion.h1>
              </div>

              <motion.div {...fade(formReady)} className="mt-[clamp(0.9rem,2.6dvh,1.6rem)] flex w-full flex-1 flex-col items-center">
                <form onSubmit={onSubmit} className="flex w-full flex-col items-center" autoComplete="off" noValidate>
                  <label htmlFor="fid-word" className="sr-only">
                    {story.fidelio.inputLabel}
                  </label>
                  <motion.div
                    key={wrong}
                    initial={false}
                    animate={wrong > 0 && !reduced ? { x: [0, -9, 8, -6, 4, -2, 0] } : { x: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="relative w-full"
                  >
                    <input
                      id="fid-word"
                      ref={inputRef}
                      name="fid-word"
                      type="text"
                      inputMode="text"
                      enterKeyHint="go"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      maxLength={24}
                      value={value}
                      readOnly={revealing}
                      disabled={!formReady}
                      placeholder={story.fidelio.inputPlaceholder}
                      aria-describedby="fid-status"
                      aria-invalid={wrong > 0 ? true : undefined}
                      onChange={(e) => setValue(e.target.value.toUpperCase())}
                      className="fid-input peer block h-[52px] w-full bg-transparent pl-[0.42em] text-center font-display text-[1.6rem] font-medium uppercase leading-none tracking-[0.42em] text-gold-light outline-none"
                      style={{ fontSize: "1.6rem" }}
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent transition-opacity duration-500 peer-focus:opacity-0"
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-gold-light to-transparent opacity-0 shadow-[0_0_14px_rgba(240,220,180,0.7)] transition-opacity duration-500 peer-focus:opacity-100"
                    />
                    <span aria-hidden className="pointer-events-none absolute -bottom-[3px] left-1/2 h-[7px] w-[7px] -translate-x-1/2 rotate-45 bg-gold" />
                  </motion.div>

                  <p
                    id="fid-status"
                    role="status"
                    aria-live="polite"
                    className="mt-3 flex min-h-[1.6rem] items-center justify-center font-display text-[1.08rem] italic leading-tight text-blush"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {wrongMessage && (
                        <motion.span
                          key={wrong}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.35 }}
                        >
                          {wrongMessage}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </p>

                  <Button type="submit" variant="gold" full className="mt-2" disabled={!formReady || revealing}>
                    {story.fidelio.submit}
                  </Button>
                </form>

                <div className="mt-3 flex min-h-[2.9rem] w-full items-center justify-center" aria-live="polite">
                  <AnimatePresence mode="wait" initial={false}>
                    {hintText && (
                      <motion.p
                        key={hint}
                        initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: VELVET_EASE }}
                        className={
                          lastHint
                            ? "font-display text-[1.35rem] font-semibold tracking-[0.2em] text-gold-light"
                            : "max-w-[18.5rem] font-display text-[1.05rem] italic leading-snug text-gold-light/90 [text-wrap:balance]"
                        }
                      >
                        {hintText}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  onClick={onHint}
                  disabled={!formReady || revealing}
                  className="flex min-h-[44px] items-center gap-2 px-4 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-gold/85 transition-opacity active:opacity-60 disabled:opacity-40"
                >
                  <span aria-hidden className="text-[0.6rem]">✦</span>
                  <span className="border-b border-gold/35 pb-[3px]">
                    {lastHint ? story.fidelio.revealCta : story.fidelio.hintCta}
                  </span>
                  <span aria-hidden className="text-[0.6rem]">✦</span>
                </button>

                <div className="min-h-2 flex-1" />
                <p className="max-w-[15.5rem] pb-1 font-display text-[0.95rem] italic leading-snug text-[#f3e7d6]/50 [text-wrap:balance]">
                  {story.fidelio.small}
                </p>
              </motion.div>
            </motion.div>
          ) : phase === "open" ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="flex w-full flex-1 flex-col items-center"
            >
              <div className="flex flex-1 flex-col items-center justify-center pb-[8dvh]">
                <FadeLines
                  instant={replay}
                  delay={replay ? 0 : 0.75}
                  stagger={1.15}
                  onDone={() => setWelcomed(true)}
                  className="flex flex-col items-center gap-4 text-center"
                  lines={[
                    {
                      text: (
                        <h1 className="headline text-gold-foil animate-shimmer pb-1 text-[clamp(2.2rem,10.4vw,2.9rem)]">
                          {story.fidelio.success[0]}
                        </h1>
                      ),
                    },
                    { text: <GoldRule tone="gold" ornament="star" width={132} />, pause: -0.7 },
                    {
                      text: (
                        <p className="font-display text-[1.45rem] italic leading-snug text-[#f7ece0]">
                          {story.fidelio.success[1]}
                        </p>
                      ),
                      pause: -0.3,
                    },
                  ]}
                />
              </div>
              <motion.div
                initial={false}
                animate={{ opacity: welcomed ? 1 : 0 }}
                transition={{ duration: 0.7 }}
                className="w-full pb-2"
              >
                <Button variant="gold" full disabled={!welcomed} onClick={leave}>
                  {story.decree.continueCta}
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div key="hush" className="flex-1" />
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
