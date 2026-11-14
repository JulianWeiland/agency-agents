import type { ChapterId } from "./store";

/** The two visual worlds. Drives <html data-world>, body/stage background and the browser theme-color. */
export type World = "midnight" | "royal";

const THEME_COLOR: Record<World, string> = { midnight: "#160F1C", royal: "#FBE3E7" };

/** World a chapter OPENS in. `dates` opens in midnight and warms itself via setWorld('royal'). */
export function worldFor(chapter: ChapterId): World {
  return chapter === "portal" || chapter === "fidelio" || chapter === "cosmic" || chapter === "dates"
    ? "midnight"
    : "royal";
}

/** Switch the ambient world (background behind the chapter, SoundToggle tint, Safari chrome colour). */
export function setWorld(world: World): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.world = world;
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((m) => m.setAttribute("content", THEME_COLOR[world]));
}
