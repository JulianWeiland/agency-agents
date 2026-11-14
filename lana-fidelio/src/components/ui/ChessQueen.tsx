export interface ChessQueenProps {
  /** px (default 20) */
  size?: number;
  /** CSS colour (default currentColor) */
  color?: string;
  /** filled silhouette (default) or outline */
  variant?: "solid" | "outline";
  className?: string;
  title?: string;
}

/** Small chess-queen glyph (ornament / easter-egg trigger). */
export function ChessQueen({ size = 20, color = "currentColor", variant = "solid", className = "", title }: ChessQueenProps) {
  const solid = variant === "solid";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={solid ? color : "none"}
      stroke={color}
      strokeWidth={solid ? 0.6 : 1.2}
      strokeLinejoin="round"
      strokeLinecap="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={`inline-block shrink-0 ${className}`}
    >
      <circle cx="12" cy="3.4" r="1.4" />
      <circle cx="4.2" cy="6.4" r="1.3" />
      <circle cx="19.8" cy="6.4" r="1.3" />
      <circle cx="7.9" cy="4.5" r="1.2" />
      <circle cx="16.1" cy="4.5" r="1.2" />
      <path d="M4.6 8.2 7 16h10l2.4-7.8-3.7 4.2-.2-6-3.5 5.6L8.5 6.4l-.2 6Z" />
      <path d="M7 17.2h10l.9 2.1H6.1Z" />
      <path d="M5.2 20.4h13.6v1.4H5.2Z" />
    </svg>
  );
}

export default ChessQueen;
