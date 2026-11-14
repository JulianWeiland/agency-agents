"use client";

import { useEffect, useState } from "react";
import { assets, preloadImage } from "@/lib/assets";

/** right half of a Venetian colombina; mirrored for the left */
const HALF =
  "M160 58 C176 45 204 35 232 37 C262 39 285 32 306 14 C309 50 300 88 277 111 C256 131 226 141 203 134 C188 129 178 124 172 136 C168 146 164 152 160 155 Z";
const EYE = "M189 89 C201 68 238 61 259 76 C251 99 212 107 189 89 Z";
const EYE_RIM = "M184 90 C198 62 241 54 266 74 C257 105 209 114 184 90 Z";

function Half() {
  return (
    <g>
      <path d={`${HALF} ${EYE}`} fill="url(#gm-gold)" fillRule="evenodd" />
      <path d={`${HALF} ${EYE}`} fill="url(#gm-sheen)" fillRule="evenodd" />
      {/* rims */}
      <path d={HALF} fill="none" stroke="url(#gm-rim)" strokeWidth="1.6" strokeLinejoin="round" />
      <path d={EYE} fill="none" stroke="#fbeccb" strokeOpacity="0.9" strokeWidth="1.2" />
      <path d={EYE_RIM} fill="none" stroke="#7a5a2c" strokeOpacity="0.55" strokeWidth="0.9" />
      {/* filigree */}
      <g fill="none" stroke="#fff3d6" strokeOpacity="0.62" strokeWidth="1.05" strokeLinecap="round">
        <path d="M170 66 C184 54 204 48 222 49 C233 50 238 57 232 61 C227 64 222 59 226 56" />
        <path d="M250 50 C266 50 282 44 296 32 C297 44 292 56 284 62 C278 66 273 61 277 57" />
        <path d="M270 100 C262 112 248 121 232 124 C222 126 217 119 222 115 C226 112 230 116 227 119" />
        <path d="M178 118 C186 114 196 116 204 122" />
        <path d="M166 84 C171 96 172 110 168 124" />
      </g>
      <g fill="#fff3d6" fillOpacity="0.8">
        <circle cx="243" cy="45" r="1.5" />
        <circle cx="286" cy="74" r="1.4" />
        <circle cx="279" cy="88" r="1.2" />
        <circle cx="212" cy="126" r="1.3" />
        <circle cx="190" cy="60" r="1.2" />
      </g>
    </g>
  );
}

function SvgMask() {
  return (
    <svg viewBox="0 0 320 172" className="block h-auto w-full" aria-hidden>
      <defs>
        <linearGradient id="gm-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f6e3b6" />
          <stop offset="34%" stopColor="#d7b47b" />
          <stop offset="68%" stopColor="#a47e45" />
          <stop offset="100%" stopColor="#6f4f24" />
        </linearGradient>
        <radialGradient id="gm-sheen" cx="50%" cy="18%" r="62%">
          <stop offset="0%" stopColor="#fffaf0" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#fff3d6" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#2a1608" stopOpacity="0.34" />
        </radialGradient>
        <linearGradient id="gm-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff6dd" />
          <stop offset="100%" stopColor="#8a6634" />
        </linearGradient>
        <radialGradient id="gm-ruby" cx="38%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ff9db4" />
          <stop offset="40%" stopColor="#b3123f" />
          <stop offset="100%" stopColor="#3d0616" />
        </radialGradient>
      </defs>
      <Half />
      <g transform="translate(320 0) scale(-1 1)">
        <Half />
      </g>
      {/* brow jewel */}
      <path d="M160 40 L167 56 L160 76 L153 56 Z" fill="url(#gm-ruby)" stroke="#fbeccb" strokeWidth="1" strokeLinejoin="round" />
      <path d="M160 44 L163.5 56 L160 60 L156.5 56 Z" fill="#fff" fillOpacity="0.28" />
      <circle cx="160" cy="31" r="2.6" fill="#f6e3b6" />
      <circle cx="160" cy="22" r="1.6" fill="#f6e3b6" fillOpacity="0.8" />
      <circle cx="160" cy="15" r="1" fill="#f6e3b6" fillOpacity="0.6" />
      <circle cx="160" cy="84" r="1.6" fill="#f6e3b6" fillOpacity="0.85" />
    </svg>
  );
}

/**
 * The golden mask: /assets/mask.webp when it exists, otherwise an inline-SVG colombina.
 * Renders nothing until we know which — it emerges from shadow anyway.
 */
export function GoldenMask({ className = "" }: { className?: string }) {
  const [mode, setMode] = useState<"pending" | "image" | "svg">("pending");

  useEffect(() => {
    let alive = true;
    preloadImage(assets.mask.image).then((ok) => {
      if (alive) setMode(ok ? "image" : "svg");
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className={`relative aspect-[320/172] w-full ${className}`}>
      {mode === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={assets.mask.image}
          alt=""
          draggable={false}
          onError={() => setMode("svg")}
          className="absolute inset-0 h-full w-full animate-fade-in object-contain"
        />
      )}
      {mode === "svg" && (
        <div className="absolute inset-0 animate-fade-in">
          <SvgMask />
        </div>
      )}
    </div>
  );
}

export default GoldenMask;
