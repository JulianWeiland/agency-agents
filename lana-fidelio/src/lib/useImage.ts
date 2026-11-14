"use client";

import { useEffect, useState } from "react";
import { preloadImage } from "./assets";

/** null while loading · true once the image is usable · false when it is missing. */
export function useImageOk(src: string): boolean | null {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    void preloadImage(src).then((v) => {
      if (alive) setOk(v);
    });
    return () => {
      alive = false;
    };
  }, [src]);
  return ok;
}
