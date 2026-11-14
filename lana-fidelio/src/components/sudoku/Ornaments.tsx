import { ChessQueen } from "@/components/ui";

/** A wisp of constellation: five stars on a hairline, echoing Scorpio's curling tail. */
export function Constellation({ flip = false, width = 58, color = "#a47e45" }: { flip?: boolean; width?: number; color?: string }) {
  const stars: readonly (readonly [number, number, number])[] = [
    [3, 9, 1.1],
    [15, 5, 1.5],
    [28, 8, 1.1],
    [40, 4, 1.8],
    [53, 10, 1.2],
  ];
  return (
    <svg
      width={width}
      height={(width * 14) / 58}
      viewBox="0 0 58 14"
      fill="none"
      aria-hidden
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <polyline
        points={stars.map(([x, y]) => `${x},${y}`).join(" ")}
        stroke={color}
        strokeWidth={0.5}
        strokeOpacity={0.7}
        strokeLinecap="round"
      />
      {stars.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={color} />
      ))}
    </svg>
  );
}

/** constellation · queen · constellation — sits outside the grid. */
export function QueenRule({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden>
      <Constellation />
      <ChessQueen size={15} color="#a47e45" />
      <Constellation flip />
    </div>
  );
}
