"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";

export interface BackdropProps {
  /** poster / still image URL (see lib/assets). Missing or broken → the fallback gradient stays visible. */
  image?: string;
  /** optional muted looping video URL; only mounted while `active`, fades in once it can play */
  video?: string;
  /** mount + play the video (default true). Pass false while the chapter is not visible. */
  active?: boolean;
  /**
   * Tailwind/CSS classes for a tint layer above the media, e.g.
   * "bg-gradient-to-b from-plum/30 via-transparent to-plum/90". Omit for none.
   */
  overlay?: string;
  /** classes for the always-present gradient under the media: 'bg-midnight' | 'bg-ruby-crystal' | 'bg-royal' | custom */
  fallbackClassName?: string;
  /** classes for the media elements, e.g. "object-top" (default: object-cover object-center) */
  mediaClassName?: string;
  /** classes for the root (default "absolute inset-0"). Root is always overflow-hidden. */
  className?: string;
  /** alt text; leave empty for decorative imagery */
  alt?: string;
  /** optional content rendered above all layers (relative, z-10, full height) */
  children?: ReactNode;
}

/**
 * Full-bleed cinematic background: gradient → poster image → optional video → overlay.
 * Put it first inside a `relative` container (e.g. a `.chapter` root).
 */
export function Backdrop({
  image,
  video,
  active = true,
  overlay,
  fallbackClassName = "bg-midnight",
  mediaClassName = "object-center",
  className = "absolute inset-0",
  alt = "",
  children,
}: BackdropProps) {
  const reduced = useReducedMotion();
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgState, setImgState] = useState<"loading" | "ready" | "error">("loading");
  const [videoState, setVideoState] = useState<"loading" | "ready" | "error">("loading");
  const [lastImage, setLastImage] = useState(image);
  const [lastVideo, setLastVideo] = useState(video);

  // reset when the source changes (derived-state pattern, no effect needed)
  if (image !== lastImage) {
    setLastImage(image);
    setImgState("loading");
  }
  if (video !== lastVideo) {
    setLastVideo(video);
    setVideoState("loading");
  }

  // the image may already be cached/complete before React attaches onLoad
  useEffect(() => {
    const el = imgRef.current;
    if (!el || !el.complete) return;
    const ok = el.naturalWidth > 0;
    const id = requestAnimationFrame(() => setImgState(ok ? "ready" : "error"));
    return () => cancelAnimationFrame(id);
  }, [image]);

  // the poster always comes first: the video is only requested once the still has settled
  const showVideo = !!video && active && !reduced && videoState !== "error" && imgState !== "loading";

  return (
    <div className={`${className} overflow-hidden`} aria-hidden={alt ? undefined : true}>
      <div className={`absolute inset-0 ${fallbackClassName}`} />
      {image && imgState !== "error" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={image}
          alt={alt}
          decoding="async"
          draggable={false}
          onLoad={() => setImgState("ready")}
          onError={() => setImgState("error")}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out ${mediaClassName} ${
            imgState === "ready" ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
      {showVideo && (
        <video
          key={video}
          src={video}
          poster={image && imgState === "ready" ? image : undefined}
          muted
          loop
          autoPlay
          playsInline
          preload="auto"
          disablePictureInPicture
          tabIndex={-1}
          onCanPlay={() => setVideoState("ready")}
          onPlaying={() => setVideoState("ready")}
          onError={() => setVideoState("error")}
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-out ${mediaClassName} ${
            videoState === "ready" ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
      {overlay && <div className={`absolute inset-0 ${overlay}`} />}
      {children !== undefined && <div className="relative z-10 h-full">{children}</div>}
    </div>
  );
}

export default Backdrop;
