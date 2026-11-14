/**
 * Tiny WebAudio synth — no files, off by default, restaurant-soft.
 * Every exported sound is a no-op unless sound is ON (store.setSound(true))
 * and the AudioContext has been unlocked by a user gesture.
 */

let enabled = false;
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let unlockBound = false;

const MASTER_VOLUME = 0.16;

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  try {
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = MASTER_VOLUME;
    // gentle low-pass keeps everything warm and un-piercing
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 5200;
    master.connect(lp).connect(ctx.destination);
  } catch {
    ctx = null;
    master = null;
  }
  return ctx;
}

/** Call from a user gesture (pointerdown/click). Creates/resumes the context if sound is on. */
export function unlockAudio(): void {
  if (!enabled) return;
  const c = ensureContext();
  if (c && c.state === "suspended") void c.resume().catch(() => {});
}

function bindUnlock() {
  if (unlockBound || typeof window === "undefined") return;
  unlockBound = true;
  const handler = () => unlockAudio();
  window.addEventListener("pointerdown", handler, { passive: true });
  window.addEventListener("keydown", handler, { passive: true });
}

/** Used by the store; chapters should call `setSound()` from useExperience() instead. */
export function setAudioEnabled(on: boolean, fromGesture = false): void {
  enabled = on;
  if (on) {
    bindUnlock();
    if (fromGesture) unlockAudio();
  } else if (ctx && ctx.state === "running") {
    void ctx.suspend().catch(() => {});
  }
}

export function isAudioEnabled(): boolean {
  return enabled;
}

interface Note {
  freq: number;
  /** seconds from now */
  at?: number;
  /** decay length in seconds */
  dur?: number;
  /** peak gain 0..1 (before master) */
  gain?: number;
  type?: OscillatorType;
  /** glide to this frequency over the note */
  to?: number;
}

function play(notes: Note[]): void {
  if (!enabled) return;
  const c = ctx;
  // Only ever sound on an already-unlocked context (created inside a gesture).
  if (!c || !master || c.state !== "running") return;
  try {
    const now = c.currentTime + 0.01;
    for (const n of notes) {
      const t = now + (n.at ?? 0);
      const dur = n.dur ?? 0.8;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = n.type ?? "sine";
      osc.frequency.setValueAtTime(n.freq, t);
      if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, n.gain ?? 0.3), t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g).connect(master);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    }
  } catch {
    /* never let audio break the experience */
  }
}

/** Soft crystal bell — chapter arrivals, reveals. */
export function chime(): void {
  play([
    { freq: 880, dur: 1.8, gain: 0.3 },
    { freq: 1320, dur: 1.3, gain: 0.12 },
    { freq: 2640, dur: 0.6, gain: 0.04 },
  ]);
}

/** Barely-there tick for buttons / pad presses. */
export function tap(): void {
  play([{ freq: 1250, to: 900, dur: 0.07, gain: 0.12, type: "triangle" }]);
}

/** Rising glitter — crystals dissolving, gift opening. */
export function shimmer(): void {
  const scale = [1568, 1760, 2093, 2349, 2637, 3136];
  play(scale.map((freq, i) => ({ freq, at: i * 0.07, dur: 0.9, gain: 0.07 })));
}

/** Warm resolved arpeggio — password accepted, sudoku solved, kingdom chosen. */
export function success(): void {
  play([
    { freq: 523.25, at: 0, dur: 1.4, gain: 0.22 },
    { freq: 659.25, at: 0.11, dur: 1.4, gain: 0.2 },
    { freq: 783.99, at: 0.22, dur: 1.5, gain: 0.2 },
    { freq: 1046.5, at: 0.36, dur: 2.0, gain: 0.22 },
  ]);
}

/** Gentle "not quite" — two soft descending notes, never harsh. */
export function error(): void {
  play([
    { freq: 392, at: 0, dur: 0.35, gain: 0.16 },
    { freq: 311.13, at: 0.13, dur: 0.5, gain: 0.14 },
  ]);
}
