import type { CSSProperties } from "react";
import { assets } from "@/lib/assets";

export interface SignatureProps {
  /**
   * 'gold' — champagne foil (dark world) · 'ruby' / 'rose' — for pink paper ·
   * 'ink' — the original blue-ink scan, untinted
   */
  tone?: "gold" | "ruby" | "rose" | "ink";
  /** rendered width in px (default 168); height follows the 676:217 aspect */
  width?: number;
  /** handwriting reveal: wipes in from the left on mount */
  write?: boolean;
  /** seconds before the write animation starts */
  delay?: number;
  className?: string;
  style?: CSSProperties;
}

const FILL: Record<Exclude<SignatureProps["tone"], "ink" | undefined>, string> = {
  gold: "linear-gradient(100deg,#B08A50 0%,#F0DCB4 38%,#D7B47B 62%,#A47E45 100%)",
  ruby: "linear-gradient(100deg,#5A0820 0%,#850C30 55%,#A31442 100%)",
  rose: "linear-gradient(100deg,#B5767E 0%,#C98D93 50%,#A9656F 100%)",
};

/** Julian's real signature, tinted through a CSS mask (signature-mask.png). */
export function Signature({ tone = "gold", width = 168, write = false, delay = 0, className = "", style }: SignatureProps) {
  const height = Math.round(width / assets.signature.aspect);
  const common: CSSProperties = {
    width,
    height,
    animationDelay: write ? `${delay}s` : undefined,
    ...style,
  };
  const cls = `inline-block shrink-0 ${write ? "signature-write" : ""} ${className}`;

  if (tone === "ink") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={assets.signature.ink}
        alt="Julian"
        width={width}
        height={height}
        draggable={false}
        className={cls}
        style={common}
      />
    );
  }
  const url = `url(${assets.signature.mask})`;
  return (
    <span
      role="img"
      aria-label="Julian"
      className={cls}
      style={{
        ...common,
        background: FILL[tone],
        WebkitMaskImage: url,
        maskImage: url,
        WebkitMaskSize: "100% 100%",
        maskSize: "100% 100%",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
      }}
    />
  );
}

export default Signature;
