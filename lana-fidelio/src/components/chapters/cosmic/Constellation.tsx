"use client";

import { motion } from "motion/react";
import { seeded } from "../portal/sequence";

/**
 * Scorpius, plotted from approximate J2000 positions (RA in hours, Dec in degrees),
 * as it hangs in the evening sky: east to the left, claws upper-right, the tail
 * curling down to the stinger at lower-left.
 */
interface Star {
  id: string;
  name: string;
  ra: number;
  dec: number;
  mag: number;
}

const STARS: readonly Star[] = [
  { id: "bet", name: "Graffias", ra: 16.09, dec: -19.81, mag: 2.6 },
  { id: "del", name: "Dschubba", ra: 16.005, dec: -22.62, mag: 2.3 },
  { id: "pi", name: "Pi Scorpii", ra: 15.981, dec: -26.11, mag: 2.9 },
  { id: "sig", name: "Alniyat", ra: 16.353, dec: -25.59, mag: 2.9 },
  { id: "alf", name: "Antares", ra: 16.49, dec: -26.43, mag: 1.0 },
  { id: "tau", name: "Paikauhale", ra: 16.598, dec: -28.22, mag: 2.8 },
  { id: "eps", name: "Larawag", ra: 16.836, dec: -34.29, mag: 2.3 },
  { id: "mu", name: "Xamidimura", ra: 16.865, dec: -38.05, mag: 3.0 },
  { id: "zet", name: "Zeta Scorpii", ra: 16.91, dec: -42.36, mag: 3.6 },
  { id: "eta", name: "Eta Scorpii", ra: 17.203, dec: -43.24, mag: 3.3 },
  { id: "the", name: "Sargas", ra: 17.622, dec: -43.0, mag: 1.9 },
  { id: "iot", name: "Iota Scorpii", ra: 17.793, dec: -40.13, mag: 3.0 },
  { id: "kap", name: "Girtab", ra: 17.708, dec: -39.03, mag: 2.4 },
  { id: "lam", name: "Shaula", ra: 17.56, dec: -37.1, mag: 1.6 },
  { id: "ups", name: "Lesath", ra: 17.513, dec: -37.3, mag: 2.7 },
];

/** drawing order: [from, to] — the claws first, then the heart, the body and the curl of the tail */
const LINKS: readonly (readonly [string, string])[] = [
  ["bet", "del"],
  ["del", "pi"],
  ["del", "sig"],
  ["sig", "alf"],
  ["alf", "tau"],
  ["tau", "eps"],
  ["eps", "mu"],
  ["mu", "zet"],
  ["zet", "eta"],
  ["eta", "the"],
  ["the", "iot"],
  ["iot", "kap"],
  ["kap", "lam"],
  ["lam", "ups"],
];

const SIZE = 100;
const PAD = 11;
const COS = Math.cos((32 * Math.PI) / 180);
const RA_MAX = Math.max(...STARS.map((s) => s.ra));
const DEC_MAX = Math.max(...STARS.map((s) => s.dec));
const SPAN_X = (RA_MAX - Math.min(...STARS.map((s) => s.ra))) * 15 * COS;
const SPAN_Y = DEC_MAX - Math.min(...STARS.map((s) => s.dec));
const SCALE = (SIZE - PAD * 2) / Math.max(SPAN_X, SPAN_Y);
const OFF_X = (SIZE - SPAN_X * SCALE) / 2;
const OFF_Y = (SIZE - SPAN_Y * SCALE) / 2;

interface Plotted extends Star {
  x: number;
  y: number;
  r: number;
  /** seconds at which this star appears */
  at: number;
}

const STEP = 0.2;
const order: string[] = ["bet"];
for (const [, to] of LINKS) order.push(to);

const POS: Record<string, Plotted> = {};
for (const s of STARS) {
  POS[s.id] = {
    ...s,
    x: OFF_X + (RA_MAX - s.ra) * 15 * COS * SCALE,
    y: OFF_Y + (DEC_MAX - s.dec) * SCALE,
    r: Math.max(0.85, 2.45 - 0.42 * s.mag),
    at: 0.25 + order.indexOf(s.id) * STEP,
  };
}
const PLOTTED = STARS.map((s) => POS[s.id]);

const SEGMENTS = LINKS.map(([a, b]) => {
  const p = POS[a];
  const q = POS[b];
  const len = Math.hypot(q.x - p.x, q.y - p.y);
  const ux = (q.x - p.x) / len;
  const uy = (q.y - p.y) / len;
  const g1 = Math.min(len * 0.3, p.r + 1.1);
  const g2 = Math.min(len * 0.3, q.r + 1.1);
  return {
    key: `${a}-${b}`,
    d: `M${(p.x + ux * g1).toFixed(2)} ${(p.y + uy * g1).toFixed(2)}L${(q.x - ux * g2).toFixed(2)} ${(q.y - uy * g2).toFixed(2)}`,
    at: q.at - STEP * 0.9,
  };
});

/** total draw time in seconds (the chapter starts its reading after this) */
export const DRAW_SECONDS = 0.25 + (order.length - 1) * STEP + 0.6;

const rnd = seeded(2002);
const FIELD = Array.from({ length: 46 }, (_, i) => ({
  x: rnd() * SIZE,
  y: rnd() * SIZE,
  r: 0.12 + rnd() * 0.26,
  o: 0.25 + rnd() * 0.5,
  twinkle: i % 4 === 0,
  delay: rnd() * 4,
}));

function sparkle(x: number, y: number, len: number) {
  const w = len * 0.11;
  return `M${x} ${y - len}L${x + w} ${y - w}L${x + len} ${y}L${x + w} ${y + w}L${x} ${y + len}L${x - w} ${y + w}L${x - len} ${y}L${x - w} ${y - w}Z`;
}

export function Constellation({ instant = false, className = "" }: { instant?: boolean; className?: string }) {
  const antares = POS.alf;
  return (
    <svg
      // remount on skip so everything snaps to its final state
      key={instant ? "still" : "draw"}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={`block h-full w-full overflow-visible ${className}`}
      role="img"
      aria-label="The constellation Scorpius, with Antares at its heart"
    >
      <defs>
        <radialGradient id="cs-halo">
          <stop offset="0%" stopColor="#fbeccb" stopOpacity="0.85" />
          <stop offset="45%" stopColor="#d7b47b" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#d7b47b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cs-heart-halo">
          <stop offset="0%" stopColor="#ff7f9c" stopOpacity="0.95" />
          <stop offset="34%" stopColor="#c2254f" stopOpacity="0.5" />
          <stop offset="70%" stopColor="#850c30" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#850c30" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cs-heart">
          <stop offset="0%" stopColor="#fff6e0" />
          <stop offset="45%" stopColor="#f3c58c" />
          <stop offset="100%" stopColor="#d13a5f" />
        </radialGradient>
        <linearGradient id="cs-line" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0dcb4" />
          <stop offset="100%" stopColor="#c79d5e" />
        </linearGradient>
      </defs>

      {/* faint field stars */}
      <g fill="#f6e9d8">
        {FIELD.map((s, i) => (
          <circle
            key={i}
            cx={s.x.toFixed(2)}
            cy={s.y.toFixed(2)}
            r={s.r.toFixed(2)}
            opacity={s.o.toFixed(2)}
            className={s.twinkle ? "animate-twinkle" : undefined}
            style={s.twinkle ? { animationDelay: `${-s.delay}s` } : undefined}
          />
        ))}
      </g>

      {/* gold threads */}
      <g fill="none" stroke="#e2c591" strokeWidth="0.34" strokeLinecap="round" strokeOpacity="0.78">
        {SEGMENTS.map((s) => (
          <motion.path
            key={s.key}
            d={s.d}
            initial={instant ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: { duration: STEP * 1.5, delay: s.at, ease: "easeInOut" },
              opacity: { duration: 0.05, delay: s.at },
            }}
          />
        ))}
      </g>

      {/* the stars */}
      {PLOTTED.map((s) => {
        const heart = s.id === "alf";
        const bright = s.mag < 2.5;
        return (
          <motion.g
            key={s.id}
            initial={instant ? false : { opacity: 0, scale: 0.2 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: heart ? 0.9 : 0.55, delay: s.at, ease: [0.22, 0.61, 0.36, 1] }}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          >
            <circle
              cx={s.x}
              cy={s.y}
              r={heart ? 10.5 : s.r * 3.4}
              fill={heart ? "url(#cs-heart-halo)" : "url(#cs-halo)"}
              className={heart ? "animate-slow-glow" : "animate-twinkle"}
              style={{
                animationDelay: `${-((s.x * 7 + s.y * 3) % 5)}s`,
                animationDuration: heart ? "4.6s" : `${4 + ((s.x + s.y) % 3)}s`,
              }}
            />
            {(bright || heart) && (
              <path d={sparkle(s.x, s.y, heart ? 6.2 : s.r * 2.5)} fill={heart ? "#ffd9c2" : "#fbeccb"} fillOpacity={heart ? 0.85 : 0.6} />
            )}
            <circle cx={s.x} cy={s.y} r={heart ? 2.1 : s.r * 0.72} fill={heart ? "url(#cs-heart)" : "#fff6e0"} />
          </motion.g>
        );
      })}

      {/* the heart of the scorpion */}
      <motion.text
        x={antares.x - 6.5}
        y={antares.y + 4.6}
        textAnchor="end"
        fill="#f0dcb4"
        fontSize="2.7"
        letterSpacing="0.9"
        style={{ fontFamily: "var(--font-ui)", fontWeight: 600, textTransform: "uppercase" }}
        initial={instant ? false : { opacity: 0 }}
        animate={{ opacity: 0.72 }}
        transition={{ duration: 1.2, delay: instant ? 0 : antares.at + 0.5 }}
      >
        Antares
      </motion.text>
    </svg>
  );
}

export default Constellation;
