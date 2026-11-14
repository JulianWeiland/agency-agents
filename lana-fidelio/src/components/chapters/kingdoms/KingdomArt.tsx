import type { KingdomId } from "@/lib/story";

/**
 * Painted-in-code stand-ins for the destination imagery. They sit UNDER the photo/video,
 * so they are only seen while the real asset loads — or instead of it, if it never arrives.
 */
export function KingdomArt({ kingdom, className = "" }: { kingdom: KingdomId; className?: string }) {
  const cls = `absolute inset-0 h-full w-full ${className}`;
  if (kingdom === "sea") {
    return (
      <svg viewBox="0 0 300 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={cls}>
        <defs>
          <linearGradient id="ka-sea-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f7c9c4" />
            <stop offset="0.45" stopColor="#fbe3d6" />
            <stop offset="1" stopColor="#fdf1e2" />
          </linearGradient>
          <linearGradient id="ka-sea-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8fd3d0" />
            <stop offset="0.35" stopColor="#4fbcc2" />
            <stop offset="0.8" stopColor="#2f9fb0" />
            <stop offset="1" stopColor="#7fd0cd" />
          </linearGradient>
          <radialGradient id="ka-sea-sun" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#fff8f0" stopOpacity="1" />
            <stop offset="0.25" stopColor="#ffe9c9" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffe9c9" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ka-sea-sand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff8f0" />
            <stop offset="1" stopColor="#f3dcc8" />
          </linearGradient>
        </defs>
        <rect width="300" height="500" fill="url(#ka-sea-sky)" />
        <circle cx="196" cy="196" r="120" fill="url(#ka-sea-sun)" />
        <circle cx="196" cy="196" r="17" fill="#fffaf2" />
        <rect y="214" width="300" height="286" fill="url(#ka-sea-water)" />
        {/* sun path on the water */}
        <g fill="#fff8f0">
          <rect x="176" y="220" width="40" height="1.6" rx="0.8" opacity="0.85" />
          <rect x="168" y="230" width="56" height="1.8" rx="0.9" opacity="0.6" />
          <rect x="182" y="243" width="34" height="2" rx="1" opacity="0.5" />
          <rect x="160" y="259" width="70" height="2.2" rx="1.1" opacity="0.35" />
          <rect x="186" y="280" width="30" height="2.4" rx="1.2" opacity="0.28" />
        </g>
        {/* slow swells */}
        <g fill="none" stroke="#fff" strokeLinecap="round">
          <path d="M-10 300 C 50 290 90 310 150 300 S 250 290 310 302" strokeOpacity="0.22" strokeWidth="1.4" />
          <path d="M-10 345 C 60 332 110 356 170 344 S 260 334 310 348" strokeOpacity="0.26" strokeWidth="1.8" />
        </g>
        {/* shoreline */}
        <path d="M-10 420 C 60 392 130 430 200 408 S 290 396 310 404 V510 H-10Z" fill="#c9ecea" fillOpacity="0.75" />
        <path d="M-10 436 C 70 408 140 448 210 424 S 290 412 310 420 V510 H-10Z" fill="url(#ka-sea-sand)" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 300 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={cls}>
      <defs>
        <linearGradient id="ka-bal-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2140" />
          <stop offset="0.38" stopColor="#8a4a66" />
          <stop offset="0.62" stopColor="#e39a8f" />
          <stop offset="0.78" stopColor="#f6cfa4" />
          <stop offset="1" stopColor="#f6cfa4" />
        </linearGradient>
        <linearGradient id="ka-bal-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7b4763" />
          <stop offset="1" stopColor="#a8647a" />
        </linearGradient>
        <linearGradient id="ka-bal-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d2140" />
          <stop offset="1" stopColor="#2a152e" />
        </linearGradient>
        <linearGradient id="ka-bal-pool" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0b79c" />
          <stop offset="0.5" stopColor="#b9788a" />
          <stop offset="1" stopColor="#5a3355" />
        </linearGradient>
        <radialGradient id="ka-bal-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffe6bf" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffe6bf" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="300" height="500" fill="url(#ka-bal-sky)" />
      <ellipse cx="150" cy="368" rx="210" ry="80" fill="url(#ka-bal-glow)" />
      {/* first stars */}
      <g fill="#fff8f0">
        <circle cx="52" cy="46" r="1" opacity="0.8" />
        <circle cx="118" cy="82" r="0.8" opacity="0.6" />
        <circle cx="236" cy="38" r="1.1" opacity="0.75" />
        <circle cx="262" cy="112" r="0.8" opacity="0.5" />
        <circle cx="176" cy="24" r="0.7" opacity="0.6" />
      </g>
      {/* far skyline */}
      <path
        d="M0 372 V338 h14 v-22 h12 v30 h10 v-48 h9 v-16 h7 v16 h9 v52 h12 v-34 h16 v24 h8 v-66 h6 v-22 h5 v22 h7 v70 h14 v-40 h13 v28 h9 v-58 h11 v46 h12 v-24 h15 v36 h10 v-50 h8 v-14 h6 v14 h8 v58 h12 v-30 h14 v38 H300 V372Z"
        fill="url(#ka-bal-far)"
        opacity="0.85"
      />
      {/* near skyline */}
      <path
        d="M0 384 V352 h20 v-30 h16 v40 h14 v-74 h5 l6 -26 6 26 h5 v82 h18 v-44 h20 v-18 h12 v52 h12 v-96 h8 v-20 h6 v20 h8 v104 h16 v-36 h18 v28 h12 v-62 h14 v48 h16 v-28 h14 v44 H300 V384Z"
        fill="url(#ka-bal-near)"
      />
      {/* lit windows */}
      <g fill="#ffdca8" opacity="0.85">
        <rect x="65" y="300" width="1.6" height="3" />
        <rect x="70" y="316" width="1.6" height="3" />
        <rect x="65" y="334" width="1.6" height="3" />
        <rect x="26" y="336" width="1.6" height="3" />
        <rect x="104" y="330" width="1.6" height="3" />
        <rect x="150" y="270" width="1.6" height="3" />
        <rect x="155" y="292" width="1.6" height="3" />
        <rect x="150" y="318" width="1.6" height="3" />
        <rect x="186" y="344" width="1.6" height="3" />
        <rect x="222" y="318" width="1.6" height="3" />
        <rect x="228" y="336" width="1.6" height="3" />
        <rect x="262" y="350" width="1.6" height="3" />
      </g>
      {/* infinity edge */}
      <rect y="384" width="300" height="116" fill="url(#ka-bal-pool)" />
      <rect y="384" width="300" height="1.4" fill="#ffe6bf" opacity="0.75" />
      <g fill="none" stroke="#fff8f0" strokeLinecap="round">
        <path d="M30 412 H120" strokeOpacity="0.2" strokeWidth="1.2" />
        <path d="M150 432 H270" strokeOpacity="0.16" strokeWidth="1.4" />
        <path d="M60 462 H200" strokeOpacity="0.12" strokeWidth="1.6" />
      </g>
    </svg>
  );
}

export default KingdomArt;
