/**
 * Asset manifest (public/assets/…). Every visual MUST degrade gracefully to a CSS
 * gradient when a file is missing or slow — <Backdrop> handles that for you.
 */

const A = "/assets";

export interface SceneAsset {
  /** poster / still (webp) */
  image: string;
  /** optional muted loop (mp4); poster = image */
  video?: string;
}

export const assets = {
  portal: { image: `${A}/portal.webp`, video: `${A}/portal.mp4` },
  chamber: { image: `${A}/chamber.webp`, video: `${A}/chamber.mp4` },
  mask: { image: `${A}/mask.webp` },
  scorpio: { image: `${A}/scorpio.webp` },
  bloom: { image: `${A}/bloom.webp`, video: `${A}/bloom.mp4` },
  giftbox: {
    image: `${A}/giftbox-closed.webp`,
    closed: `${A}/giftbox-closed.webp`,
    open: `${A}/giftbox-open.webp`,
    video: `${A}/giftbox.mp4`,
  },
  sea: { image: `${A}/sea.webp`, video: `${A}/sea.mp4` },
  balance: { image: `${A}/balance.webp`, video: `${A}/balance.mp4` },
  paper: { image: `${A}/paper.webp` },
  flowers: {
    image: `${A}/flower-1.webp`,
    all: [`${A}/flower-1.webp`, `${A}/flower-2.webp`, `${A}/flower-3.webp`] as const,
  },
  signature: {
    image: `${A}/signature-mask.png`,
    /** white + alpha — tint with CSS mask (see <Signature>) */
    mask: `${A}/signature-mask.png`,
    /** original blue ink */
    ink: `${A}/signature-ink.png`,
    /** intrinsic aspect ratio (676 × 217) */
    aspect: 676 / 217,
  },
} as const;

export type AssetKey = keyof typeof assets;

const preloaded = new Map<string, Promise<boolean>>();

/**
 * Preload (and decode) an image. Resolves true when usable, false when missing —
 * never rejects, safe to fire-and-forget. Results are memoised per URL.
 */
export function preloadImage(src: string): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  const hit = preloaded.get(src);
  if (hit) return hit;
  const p = new Promise<boolean>((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
  preloaded.set(src, p);
  return p;
}

export function preloadImages(srcs: readonly string[]): Promise<boolean[]> {
  return Promise.all(srcs.map(preloadImage));
}
