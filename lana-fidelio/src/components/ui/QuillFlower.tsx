import type { CSSProperties } from "react";

export interface QuillFlowerProps {
  /** px (default 96) — the SVG is square */
  size?: number;
  /** petal paper colour (default blush #F4B7C3) */
  color?: string;
  /** centre coil colour (default champagne gold) */
  center?: string;
  /** draw two quilled green leaves behind the bloom */
  leaf?: boolean;
  /** leaf colour */
  leafColor?: string;
  /** number of petals, 5–8 (default 6) */
  petals?: number;
  /** petals + leaves unfurl one after another on mount */
  unfurl?: boolean;
  /** seconds before the unfurl starts */
  delay?: number;
  /** rotate the whole flower (deg) */
  rotate?: number;
  className?: string;
  style?: CSSProperties;
}

/** Archimedean coil as an SVG path — the rolled paper strip seen edge-on. */
function coil(cx: number, cy: number, r: number, turns: number, start = 0): string {
  const steps = Math.max(24, Math.round(turns * 22));
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = start + t * turns * Math.PI * 2;
    const rr = r * t;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
}

const PETAL = "M0 -7 C 11 -13 14.5 -31 0 -43 C -14.5 -31 -11 -13 0 -7 Z";
const PETAL_COIL = coil(0, -27, 7.6, 2.6, Math.PI / 2);
const LEAF = "M0 0 C 9 -9 11 -27 0 -40 C -11 -27 -9 -9 0 0 Z";
const CENTER_COIL = coil(0, 0, 6.4, 3.4);

/**
 * Inline SVG paper-quilling flower (teardrop coils around a tight centre), echoing the
 * handmade birthday card. Pure SVG + CSS, cheap enough to scatter a dozen on screen.
 */
export function QuillFlower({
  size = 96,
  color = "#F4B7C3",
  center = "#D7B47B",
  leaf = false,
  leafColor = "#8FAE84",
  petals = 6,
  unfurl = false,
  delay = 0,
  rotate = 0,
  className = "",
  style,
}: QuillFlowerProps) {
  const n = Math.min(8, Math.max(5, Math.round(petals)));
  const step = 360 / n;
  const anim = (i: number): CSSProperties | undefined =>
    unfurl ? { animationDelay: `${(delay + i * 0.09).toFixed(2)}s` } : undefined;
  const cls = unfurl ? "quill-unfurl" : undefined;

  return (
    <svg
      width={size}
      height={size}
      viewBox="-50 -50 100 100"
      fill="none"
      aria-hidden="true"
      className={`inline-block shrink-0 overflow-visible ${className}`}
      style={{ transform: rotate ? `rotate(${rotate}deg)` : undefined, ...style }}
    >
      {leaf &&
        [128, 205].map((deg, i) => (
          <g key={deg} transform={`rotate(${deg}) translate(0 -6)`}>
            <g className={cls} style={anim(i)}>
              <path d={LEAF} fill={leafColor} fillOpacity="0.28" stroke={leafColor} strokeWidth="2" strokeLinejoin="round" />
              <path d="M0 -3 C 2.5 -14 2.5 -26 0 -37" stroke={leafColor} strokeWidth="1.3" strokeLinecap="round" />
              <path d="M0 -12 5 -18M0 -20 5 -26M0 -12 -5 -18M0 -20 -5 -26" stroke={leafColor} strokeWidth="1" strokeLinecap="round" opacity="0.8" />
            </g>
          </g>
        ))}
      {Array.from({ length: n }, (_, i) => (
        <g key={i} transform={`rotate(${i * step})`}>
          <g className={cls} style={anim(i + (leaf ? 2 : 0))}>
            <path d={PETAL} fill={color} fillOpacity="0.38" stroke={color} strokeWidth="2.4" strokeLinejoin="round" />
            <path d={PETAL} stroke="#fff" strokeOpacity="0.55" strokeWidth="0.7" strokeLinejoin="round" />
            <path d={PETAL_COIL} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          </g>
        </g>
      ))}
      <g className={cls} style={anim(n + (leaf ? 2 : 0))}>
        <circle r="7.6" fill={center} fillOpacity="0.3" stroke={center} strokeWidth="1.8" />
        <path d={CENTER_COIL} stroke={center} strokeWidth="1.4" strokeLinecap="round" />
        <circle r="1.2" fill="#fff" fillOpacity="0.85" />
      </g>
    </svg>
  );
}

export default QuillFlower;
