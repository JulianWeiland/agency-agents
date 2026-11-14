export interface GoldRuleProps {
  /** 'gold' (default) · 'ruby' · 'rose' — or any CSS colour via `color` */
  tone?: "gold" | "ruby" | "rose";
  color?: string;
  /** total width in px (default 160) */
  width?: number;
  /** centre ornament (default 'diamond') */
  ornament?: "diamond" | "star" | "heart" | "none";
  className?: string;
}

const TONES = { gold: "#D7B47B", ruby: "#850C30", rose: "#C98D93" } as const;

/** Ornamental divider: two tapering hairlines around a small jewel. */
export function GoldRule({ tone = "gold", color, width = 160, ornament = "diamond", className = "" }: GoldRuleProps) {
  const c = color ?? TONES[tone];
  const id = `gr-${tone}-${ornament}`;
  return (
    <svg
      width={width}
      height={14}
      viewBox="0 0 160 14"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden="true"
      className={`mx-auto block shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id={`${id}-l`} x1="0" x2="1">
          <stop offset="0" stopColor={c} stopOpacity="0" />
          <stop offset="1" stopColor={c} stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={`${id}-r`} x1="0" x2="1">
          <stop offset="0" stopColor={c} stopOpacity="0.9" />
          <stop offset="1" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="6.6" width={ornament === "none" ? 80 : 64} height="0.8" fill={`url(#${id}-l)`} />
      <rect x={ornament === "none" ? 80 : 96} y="6.6" width={ornament === "none" ? 80 : 64} height="0.8" fill={`url(#${id}-r)`} />
      {ornament !== "none" && (
        <>
          <circle cx="68.5" cy="7" r="1.1" fill={c} opacity="0.8" />
          <circle cx="91.5" cy="7" r="1.1" fill={c} opacity="0.8" />
        </>
      )}
      {ornament === "diamond" && (
        <>
          <path d="M80 1.5 85.5 7 80 12.5 74.5 7Z" stroke={c} strokeWidth="0.9" />
          <path d="M80 4.4 82.6 7 80 9.6 77.4 7Z" fill={c} />
        </>
      )}
      {ornament === "star" && (
        <path d="M80 0.8 81.5 5.5 86.2 7 81.5 8.5 80 13.2 78.5 8.5 73.8 7 78.5 5.5Z" fill={c} />
      )}
      {ornament === "heart" && (
        <path
          d="M80 12c-3.9-2.7-6-4.8-6-7.2A2.9 2.9 0 0 1 80 3.3a2.9 2.9 0 0 1 6 1.5c0 2.4-2.1 4.5-6 7.2Z"
          fill={c}
        />
      )}
    </svg>
  );
}

export default GoldRule;
