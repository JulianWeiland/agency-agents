"use client";

import { seeded } from "./sequence";

/**
 * Code-only ruby crystal: a jittered triangulated facet field, lit from the upper centre.
 * Used when /assets/portal.webp is missing — must look intentional on its own.
 */
const W = 100;
const H = 178;
const COLS = 7;
const ROWS = 12;

interface Facet {
  d: string;
  fill: string;
  twinkle: boolean;
  delay: number;
}

const PALETTE = ["#1a0610", "#2b0715", "#43081d", "#5a0820", "#6f0a29", "#850c30", "#a01039", "#c2254f"];

function build(): Facet[] {
  const rnd = seeded(1511);
  const pts: [number, number][][] = [];
  for (let r = 0; r <= ROWS; r++) {
    const row: [number, number][] = [];
    for (let c = 0; c <= COLS; c++) {
      const edgeX = c === 0 || c === COLS;
      const edgeY = r === 0 || r === ROWS;
      const jx = edgeX ? 0 : (rnd() - 0.5) * (W / COLS) * 0.78;
      const jy = edgeY ? 0 : (rnd() - 0.5) * (H / ROWS) * 0.78;
      row.push([(c / COLS) * W + jx, (r / ROWS) * H + jy]);
    }
    pts.push(row);
  }
  const facets: Facet[] = [];
  const push = (a: [number, number], b: [number, number], c: [number, number]) => {
    const cx = (a[0] + b[0] + c[0]) / 3;
    const cy = (a[1] + b[1] + c[1]) / 3;
    // light falls from the upper centre; facets catch it unevenly
    const dist = Math.hypot((cx - 50) / 50, (cy - 62) / 80);
    const light = Math.max(0, 1 - dist) * 0.72 + rnd() * 0.5 - 0.12;
    const idx = Math.max(0, Math.min(PALETTE.length - 1, Math.floor(light * PALETTE.length)));
    facets.push({
      d: `M${a[0].toFixed(2)} ${a[1].toFixed(2)}L${b[0].toFixed(2)} ${b[1].toFixed(2)}L${c[0].toFixed(2)} ${c[1].toFixed(2)}Z`,
      fill: PALETTE[idx],
      twinkle: dist < 0.85 && rnd() < 0.16,
      delay: rnd() * 6,
    });
  };
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tl = pts[r][c];
      const tr = pts[r][c + 1];
      const bl = pts[r + 1][c];
      const br = pts[r + 1][c + 1];
      if ((r + c) % 2 === 0) {
        push(tl, tr, br);
        push(tl, br, bl);
      } else {
        push(tl, tr, bl);
        push(tr, br, bl);
      }
    }
  }
  return facets;
}

const FACETS = build();

export function CrystalField({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={`absolute inset-0 h-full w-full ${className}`}
    >
      <defs>
        <radialGradient id="cf-light" cx="50%" cy="34%" r="62%">
          <stop offset="0%" stopColor="#ff9db4" stopOpacity="0.38" />
          <stop offset="38%" stopColor="#b3123f" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#0b070e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cf-vignette" cx="50%" cy="38%" r="78%">
          <stop offset="30%" stopColor="#0b070e" stopOpacity="0" />
          <stop offset="78%" stopColor="#0b070e" stopOpacity="0.74" />
          <stop offset="100%" stopColor="#0b070e" stopOpacity="0.96" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="#0b070e" />
      <g stroke="#ffb9c8" strokeOpacity="0.09" strokeWidth="0.18" strokeLinejoin="round">
        {FACETS.map((f, i) => (
          <path key={i} d={f.d} fill={f.fill} />
        ))}
      </g>
      <g>
        {FACETS.filter((f) => f.twinkle).map((f, i) => (
          <path
            key={i}
            d={f.d}
            fill="#ff8fa9"
            fillOpacity="0.3"
            className="animate-twinkle"
            style={{ animationDelay: `${-f.delay}s`, animationDuration: `${5 + (i % 4)}s` }}
          />
        ))}
      </g>
      <rect width={W} height={H} fill="url(#cf-light)" style={{ mixBlendMode: "screen" }} />
      <rect width={W} height={H} fill="url(#cf-vignette)" />
    </svg>
  );
}

export default CrystalField;
