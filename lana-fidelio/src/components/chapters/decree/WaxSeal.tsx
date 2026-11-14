import type { CSSProperties } from "react";

export interface WaxSealProps {
  /** px (default 132) */
  size?: number;
  className?: string;
  style?: CSSProperties;
  /** unique suffix when several seals share a page */
  idSuffix?: string;
}

/** slightly irregular molten-wax outline (deterministic) */
function blob(): string {
  const pts: Array<[number, number]> = [];
  const n = 28;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const wobble = 1 + 0.045 * Math.sin(a * 5 + 0.6) + 0.03 * Math.sin(a * 9 + 2.1) + 0.02 * Math.cos(a * 3);
    const r = 46 * wobble;
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  let d = "";
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    if (i === 0) d += `M${p1[0].toFixed(2)} ${p1[1].toFixed(2)}`;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return `${d}Z`;
}

const BLOB = blob();

/**
 * Ruby wax seal with an embossed crown + "L" monogram. Pure SVG, no assets.
 */
export function WaxSeal({ size = 132, className = "", style, idSuffix = "a" }: WaxSealProps) {
  const g = (n: string) => `wax-${n}-${idSuffix}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="-52 -52 104 104"
      aria-hidden="true"
      className={`block shrink-0 overflow-visible ${className}`}
      style={style}
    >
      <defs>
        <radialGradient id={g("body")} cx="38%" cy="30%" r="80%">
          <stop offset="0" stopColor="#c2254f" />
          <stop offset="0.42" stopColor="#8f0d34" />
          <stop offset="0.82" stopColor="#5a0820" />
          <stop offset="1" stopColor="#3d0516" />
        </radialGradient>
        <radialGradient id={g("well")} cx="42%" cy="34%" r="75%">
          <stop offset="0" stopColor="#a31442" />
          <stop offset="0.7" stopColor="#770a2b" />
          <stop offset="1" stopColor="#5a0820" />
        </radialGradient>
        <linearGradient id={g("emboss")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e9879f" stopOpacity="0.95" />
          <stop offset="0.55" stopColor="#c2254f" stopOpacity="0.9" />
          <stop offset="1" stopColor="#8f0d34" />
        </linearGradient>
        <filter id={g("shadow")} x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#4a1526" floodOpacity="0.38" />
        </filter>
      </defs>

      <g filter={`url(#${g("shadow")})`}>
        <path d={BLOB} fill={`url(#${g("body")})`} />
      </g>
      {/* rim light on the molten edge */}
      <path d={BLOB} fill="none" stroke="#f4b7c3" strokeOpacity="0.28" strokeWidth="0.8" transform="scale(0.965)" />
      {/* pressed well */}
      <circle r="34.5" fill={`url(#${g("well")})`} />
      <circle r="34.5" fill="none" stroke="#3d0516" strokeOpacity="0.55" strokeWidth="1.2" />
      <circle r="33.2" fill="none" stroke="#f08aa3" strokeOpacity="0.35" strokeWidth="0.6" />
      <circle r="29.4" fill="none" stroke={`url(#${g("emboss")})`} strokeWidth="0.7" strokeDasharray="0.6 2.6" strokeLinecap="round" />

      {/* crown */}
      <g fill="none" stroke={`url(#${g("emboss")})`} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M-11 -9.5 -13.2 -20 -6.4 -14.6 0 -23 6.4 -14.6 13.2 -20 11 -9.5Z" fill="#8f0d34" fillOpacity="0.6" />
        <path d="M-11 -6.6H11" />
      </g>
      <g fill="#f08aa3" fillOpacity="0.9">
        <circle cx="0" cy="-25" r="1.5" />
        <circle cx="-14" cy="-21.4" r="1.25" />
        <circle cx="14" cy="-21.4" r="1.25" />
      </g>

      {/* monogram */}
      <text
        x="0.5"
        y="19"
        textAnchor="middle"
        fontFamily="var(--font-display), 'Cormorant Garamond', Georgia, serif"
        fontSize="30"
        fontWeight="600"
        fontStyle="italic"
        fill="#3d0516"
        fillOpacity="0.55"
        transform="translate(0.7 0.9)"
      >
        L
      </text>
      <text
        x="0.5"
        y="19"
        textAnchor="middle"
        fontFamily="var(--font-display), 'Cormorant Garamond', Georgia, serif"
        fontSize="30"
        fontWeight="600"
        fontStyle="italic"
        fill={`url(#${g("emboss")})`}
      >
        L
      </text>

      {/* specular highlight */}
      <path d="M-36 -22 C -30 -34 -18 -41 -6 -42" fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default WaxSeal;
