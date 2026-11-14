"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { assets, preloadImages } from "@/lib/assets";
import { QuillFlower } from "@/components/ui";

const EASE = [0.22, 0.61, 0.36, 1] as const;
const VB = "0 0 240 240";
const LAYER = "absolute inset-0 h-full w-full overflow-visible";

/** how long the drawn box takes to open before the copy may begin (ms) */
const OPEN_MS = 2500;
const OPEN_MS_REDUCED = 500;
/** never wait longer than this for the optional film */
const VIDEO_MAX_MS = 7000;

type Mode = "pending" | "image" | "drawn";

export interface GiftBoxProps {
  /** false = wrapped, true = opening / opened */
  open: boolean;
  /** render the opened state without any animation (revisits) */
  instant?: boolean;
  /** called once when the opening has finished playing */
  onOpened?: () => void;
}

/** Shared gradients; `p` keeps ids unique per SVG layer. */
function Defs({ p }: { p: string }) {
  return (
    <defs>
      <linearGradient id={`${p}-body`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#F9CCD5" />
        <stop offset="1" stopColor="#EFA5B5" />
      </linearGradient>
      <linearGradient id={`${p}-lid`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FCDCE2" />
        <stop offset="1" stopColor="#F2B0BE" />
      </linearGradient>
      <linearGradient id={`${p}-side`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#850C30" stopOpacity="0.2" />
        <stop offset="0.16" stopColor="#850C30" stopOpacity="0" />
        <stop offset="0.84" stopColor="#850C30" stopOpacity="0" />
        <stop offset="1" stopColor="#850C30" stopOpacity="0.24" />
      </linearGradient>
      <linearGradient id={`${p}-gold`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#A47E45" />
        <stop offset="0.3" stopColor="#E9CF9E" />
        <stop offset="0.5" stopColor="#FBECCB" />
        <stop offset="0.72" stopColor="#D7B47B" />
        <stop offset="1" stopColor="#9C7740" />
      </linearGradient>
      <linearGradient id={`${p}-goldv`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FBECCB" />
        <stop offset="0.45" stopColor="#D7B47B" />
        <stop offset="1" stopColor="#A47E45" />
      </linearGradient>
      <radialGradient id={`${p}-seal`} cx="0.38" cy="0.32" r="0.8">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="1" stopColor="#FBE9E1" />
      </radialGradient>
    </defs>
  );
}

/** The fully self-sufficient drawn gift box: blush paper, champagne ribbon, crown seal. */
function DrawnBox({ open, instant }: { open: boolean; instant: boolean }) {
  const reduced = useReducedMotion();
  const still = instant || !!reduced;
  const t = (duration: number, delay = 0) => (still ? { duration: 0 } : { duration, delay, ease: EASE });

  return (
    <>
      {/* soft floor shadow */}
      <svg viewBox={VB} className={LAYER} aria-hidden="true">
        <ellipse cx="120" cy="218" rx="86" ry="9" fill="#850C30" opacity="0.16" />
        <ellipse cx="120" cy="217" rx="62" ry="5" fill="#5A0820" opacity="0.14" />
      </svg>

      {/* golden light rising out of the box */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[40%] h-[92%] w-[112%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(255,250,236,0.98), rgba(246,224,176,0.72) 34%, rgba(240,200,150,0.3) 60%, transparent)",
        }}
        initial={false}
        animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.4 }}
        transition={t(1.6, 0.85)}
      />

      {/* the inside of the box, seen once the lid is gone */}
      <svg viewBox={VB} className={LAYER} aria-hidden="true">
        <path d="M46 119 194 119 186 106 54 106Z" fill="#E48FA3" />
        <path d="M46 119 194 119 186 106 54 106Z" fill="#FBECCB" opacity={open ? 0.55 : 0} style={{ transition: "opacity 1.2s ease 0.9s" }} />
      </svg>

      {/* quilled flowers unfolding out of the box (their stems stay hidden behind the front) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {open && (
          <>
            <motion.div
              className="absolute left-[21%] top-[14%] h-[36%] w-[36%]"
              initial={still ? false : { y: "55%", scale: 0.3, opacity: 0 }}
              animate={{ y: "0%", scale: 1, opacity: 1 }}
              transition={t(1.3, 1.3)}
            >
              <QuillFlower unfurl={!still} delay={1.35} color="#C98D93" petals={7} rotate={-22} leaf className="!h-full !w-full" />
            </motion.div>
            <motion.div
              className="absolute left-[46%] top-[15%] h-[35%] w-[35%]"
              initial={still ? false : { y: "55%", scale: 0.3, opacity: 0 }}
              animate={{ y: "0%", scale: 1, opacity: 1 }}
              transition={t(1.3, 1.5)}
            >
              <QuillFlower unfurl={!still} delay={1.55} color="#D9627F" petals={6} rotate={24} leaf className="!h-full !w-full" />
            </motion.div>
            <motion.div
              className="absolute left-[29%] top-[1%] h-[42%] w-[42%]"
              initial={still ? false : { y: "70%", scale: 0.3, opacity: 0 }}
              animate={{ y: "0%", scale: 1, opacity: 1 }}
              transition={t(1.4, 1.1)}
            >
              <QuillFlower unfurl={!still} delay={1.15} color="#E58CA2" petals={8} className="!h-full !w-full" />
            </motion.div>
          </>
        )}
      </div>

      {/* box front */}
      <svg viewBox={VB} className={LAYER} aria-hidden="true">
        <Defs p="gb" />
        <rect x="44" y="118" width="152" height="98" rx="3" fill="url(#gb-body)" />
        <rect x="44" y="118" width="152" height="98" rx="3" fill="url(#gb-side)" />
        {/* foil frame */}
        <rect x="52" y="127" width="136" height="80" rx="1.5" fill="none" stroke="url(#gb-gold)" strokeWidth="0.9" opacity="0.85" />
        <rect x="55.5" y="130.5" width="129" height="73" rx="1" fill="none" stroke="#D7B47B" strokeWidth="0.4" opacity="0.6" />
        {[
          [52, 127],
          [188, 127],
          [52, 207],
          [188, 207],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.7" fill="#D7B47B" />
        ))}
        <rect x="44" y="118" width="152" height="7" fill="#5A0820" opacity="0.12" />
      </svg>

      {/* vertical ribbon on the front: slips away when untied */}
      <motion.svg
        viewBox={VB}
        className={LAYER}
        aria-hidden="true"
        initial={false}
        animate={{ opacity: open ? 0 : 1 }}
        transition={t(0.8, 0.3)}
      >
        <Defs p="gr" />
        <rect x="107" y="118" width="26" height="98" fill="url(#gr-gold)" />
        <path d="M110.5 118V216M129.5 118V216" stroke="#fff" strokeOpacity="0.45" strokeWidth="0.6" />
        <rect x="107" y="118" width="26" height="7" fill="#5A0820" opacity="0.14" />
      </motion.svg>

      {/* crown seal: stays on the box */}
      <svg viewBox={VB} className={LAYER} aria-hidden="true">
        <Defs p="gs" />
        <circle cx="120" cy="169" r="21" fill="#5A0820" opacity="0.12" transform="translate(0 1.5)" />
        <circle cx="120" cy="169" r="20.5" fill="url(#gs-seal)" stroke="url(#gs-goldv)" strokeWidth="1.6" />
        <circle cx="120" cy="169" r="16.6" fill="none" stroke="#D7B47B" strokeWidth="0.5" strokeDasharray="0.8 2.2" strokeLinecap="round" />
        <g fill="url(#gs-goldv)" stroke="#A47E45" strokeWidth="0.35" strokeLinejoin="round">
          <path d="M109.2 175.2 107 162.6 114 168.8 120 159.2 126 168.8 133 162.6 130.8 175.2Z" />
          <rect x="109" y="176.4" width="22" height="2.8" rx="1" />
          <circle cx="107" cy="161.4" r="1.6" />
          <circle cx="120" cy="157.8" r="1.8" />
          <circle cx="133" cy="161.4" r="1.6" />
        </g>
        <circle cx="120" cy="172" r="1.3" fill="#B3123F" />
      </svg>

      {/* lid + bow: the bow loosens, then the lid lifts into the light */}
      <motion.div
        className="absolute inset-0"
        style={{ transformOrigin: "38% 44%" }}
        initial={false}
        animate={open ? { y: "-46%", x: "-7%", rotate: -13, opacity: 0 } : { y: "0%", x: "0%", rotate: 0, opacity: 1 }}
        transition={still ? { duration: 0 } : { duration: 1.35, delay: 0.75, ease: EASE, opacity: { duration: 0.8, delay: 1.3 } }}
      >
        <svg viewBox={VB} className={LAYER} aria-hidden="true">
          <Defs p="gl" />
          <rect x="36" y="95" width="168" height="29" rx="3.5" fill="url(#gl-lid)" />
          <rect x="36" y="95" width="168" height="29" rx="3.5" fill="url(#gl-side)" />
          <path d="M39 98.4H201" stroke="#fff" strokeOpacity="0.7" strokeWidth="0.8" strokeLinecap="round" />
          <path d="M38 121.6H202" stroke="#D7B47B" strokeOpacity="0.8" strokeWidth="0.8" />
          <rect x="107" y="95" width="26" height="29" fill="url(#gl-gold)" />
          <path d="M110.5 95V124M129.5 95V124" stroke="#fff" strokeOpacity="0.45" strokeWidth="0.6" />
        </svg>
        <motion.svg
          viewBox={VB}
          className={LAYER}
          aria-hidden="true"
          style={{ transformOrigin: "50% 38%" }}
          initial={false}
          animate={open ? { scaleX: 1.28, scaleY: 0.62, y: "5%", opacity: 0 } : { scaleX: 1, scaleY: 1, y: "0%", opacity: 1 }}
          transition={t(0.95, 0)}
        >
          <Defs p="gw" />
          {/* tails */}
          <path d="M117 96C110 106 101 111 91 125L100 127 103 119C108 111 114 106 121 99Z" fill="url(#gw-gold)" />
          <path d="M123 96C130 106 139 111 149 125L140 127 137 119C132 111 126 106 119 99Z" fill="url(#gw-gold)" />
          {/* loops */}
          <path d="M120 92C101 64 64 60 61 81 58 101 98 101 120 92Z" fill="url(#gw-gold)" stroke="#A47E45" strokeWidth="0.5" />
          <path d="M120 92C139 64 176 60 179 81 182 101 142 101 120 92Z" fill="url(#gw-gold)" stroke="#A47E45" strokeWidth="0.5" />
          <path d="M112 90C98 76 78 72 74 82 71 91 94 93 112 90Z" fill="#8C6A38" opacity="0.38" />
          <path d="M128 90C142 76 162 72 166 82 169 91 146 93 128 90Z" fill="#8C6A38" opacity="0.38" />
          <path d="M116 88C100 70 72 66 66 78" stroke="#fff" strokeOpacity="0.55" strokeWidth="0.8" fill="none" strokeLinecap="round" />
          <path d="M124 88C140 70 168 66 174 78" stroke="#fff" strokeOpacity="0.55" strokeWidth="0.8" fill="none" strokeLinecap="round" />
          {/* knot */}
          <rect x="111.5" y="82" width="17" height="18" rx="5.5" fill="url(#gw-goldv)" stroke="#A47E45" strokeWidth="0.5" />
          <path d="M115 85.5C118 84 122 84 125 85.5" stroke="#fff" strokeOpacity="0.7" strokeWidth="0.8" fill="none" strokeLinecap="round" />
        </motion.svg>
      </motion.div>
    </>
  );
}

/** Photographic box: closed still → (optional film, played once) → open still. */
function ImageBox({
  open,
  instant,
  onFilmEnd,
  filmRef,
  useFilm,
}: {
  open: boolean;
  instant: boolean;
  onFilmEnd: () => void;
  filmRef: React.RefObject<HTMLVideoElement | null>;
  useFilm: boolean;
}) {
  const reduced = useReducedMotion();
  const still = instant || !!reduced;
  // stills that sit on their own blush ground get feathered edges so they melt into the page
  // (the 9:16 stills are cropped to the square around the box and drawn a little larger than
  // the layout box, so the feather never touches the lid or the ribbons)
  const feather = "radial-gradient(ellipse 50% 50% at 50% 50%, #000 62%, transparent 99%)";
  const media: React.CSSProperties = { WebkitMaskImage: feather, maskImage: feather, objectPosition: "50% 52%" };
  const [filmDone, setFilmDone] = useState(false);
  const showOpen = open && (!useFilm || filmDone);

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[42%] h-[104%] w-[118%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(255,250,236,0.95), rgba(246,224,176,0.62) 36%, rgba(240,200,150,0.24) 62%, transparent)",
        }}
        initial={false}
        animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.5 }}
        transition={still ? { duration: 0 } : { duration: 1.6, delay: 0.3, ease: EASE }}
      />
      <motion.img
        src={assets.giftbox.closed}
        alt=""
        draggable={false}
        className="absolute -inset-[12%] h-[124%] w-[124%] -translate-x-[3%] max-w-none object-cover"
        style={media}
        initial={false}
        animate={{ opacity: open ? 0 : 1, scale: open && !still ? 1.03 : 1 }}
        transition={still ? { duration: 0 } : { duration: useFilm ? 0.5 : 1.3, delay: useFilm ? 0.25 : 0.2, ease: EASE }}
      />
      <video
        ref={filmRef}
        src={assets.giftbox.video}
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        tabIndex={-1}
        aria-hidden="true"
        onEnded={() => {
          setFilmDone(true);
          onFilmEnd();
        }}
        className="pointer-events-none absolute -inset-[12%] h-[124%] w-[124%] -translate-x-[3%] max-w-none object-cover transition-opacity duration-500"
        style={{ ...media, opacity: open && useFilm && !filmDone ? 1 : 0 }}
      />
      <motion.img
        src={assets.giftbox.open}
        alt=""
        draggable={false}
        className="absolute -inset-[12%] h-[124%] w-[124%] -translate-x-[3%] max-w-none object-cover"
        style={media}
        initial={false}
        animate={{ opacity: showOpen ? 1 : 0, scale: showOpen || still ? 1 : 0.97 }}
        transition={still ? { duration: 0 } : { duration: 1.4, delay: useFilm ? 0 : 0.45, ease: EASE }}
      />
    </>
  );
}

/**
 * The gift. Uses the photographed box when both stills are available (plus the short
 * opening film when it is already buffered at the moment of the tap); otherwise an inline
 * SVG box that needs no assets at all. Fills its parent (keep the parent square).
 */
export function GiftBox({ open, instant = false, onOpened }: GiftBoxProps) {
  const reduced = useReducedMotion();
  const [mode, setMode] = useState<Mode>("pending");
  const [useFilm, setUseFilm] = useState(false);
  const filmRef = useRef<HTMLVideoElement | null>(null);
  const onOpenedRef = useRef(onOpened);
  const firedRef = useRef(false);
  const wasOpenRef = useRef(open);

  useEffect(() => {
    onOpenedRef.current = onOpened;
  }, [onOpened]);

  // decide once which box to show; never keep her waiting for a file
  useEffect(() => {
    let live = true;
    const settle = (m: Mode) => {
      if (live) setMode((cur) => (cur === "pending" ? m : cur));
    };
    void preloadImages([assets.giftbox.closed, assets.giftbox.open]).then(([a, b]) => settle(a && b ? "image" : "drawn"));
    const id = window.setTimeout(() => settle("drawn"), 1500);
    return () => {
      live = false;
      window.clearTimeout(id);
    };
  }, []);

  const fire = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    onOpenedRef.current?.();
  };

  // the moment it opens: pick film or stills, and time the hand-over to the copy
  useEffect(() => {
    if (!open || wasOpenRef.current || instant) return;
    wasOpenRef.current = true;
    const film = filmRef.current;
    const filmReady = mode === "image" && !reduced && !!film && film.readyState >= 4 && Number.isFinite(film.duration);
    let wait = reduced ? OPEN_MS_REDUCED : mode === "image" ? 2100 : OPEN_MS;
    if (filmReady && film) {
      try {
        film.currentTime = 0;
        void film.play().catch(() => fire());
        wait = Math.min(VIDEO_MAX_MS, film.duration * 1000 + 900);
      } catch {
        /* stills take over */
      }
    }
    const raf = requestAnimationFrame(() => setUseFilm(filmReady));
    const id = window.setTimeout(fire, wait);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(id);
    };
    // mode / reduced are read at the moment of opening only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, instant]);

  return (
    <motion.div
      className="relative h-full w-full"
      initial={false}
      animate={{ opacity: mode === "pending" ? 0 : 1 }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      {mode === "image" && (
        <ImageBox open={open} instant={instant} filmRef={filmRef} useFilm={useFilm} onFilmEnd={fire} />
      )}
      {mode === "drawn" && <DrawnBox open={open} instant={instant} />}
    </motion.div>
  );
}

export default GiftBox;
