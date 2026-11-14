"use client";

import { useEffect, useRef } from "react";

export interface ParticlesProps {
  /**
   * 'dust'    — slow champagne-gold motes rising through candlelight (dark world)
   * 'petals'  — soft pink paper petals drifting down (pink world)
   * 'sparkle' — tiny four-point glints that twinkle in place
   */
  variant?: "dust" | "petals" | "sparkle";
  /** particle count (defaults: dust 34, petals 12, sparkle 22; hard cap 70) */
  count?: number;
  /** override the particle colour (any CSS colour; default depends on variant) */
  color?: string;
  /** overall opacity multiplier 0..1 (default 1) */
  intensity?: number;
  /** freeze the animation (keeps the last frame) */
  paused?: boolean;
  /** classes for the canvas (default "absolute inset-0") — always pointer-events-none */
  className?: string;
}

interface P {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  phase: number;
  speed: number;
  rot: number;
  vr: number;
  life: number;
}

const DEFAULTS = {
  dust: { count: 34, color: "#E9CF9E" },
  petals: { count: 12, color: "#F4B7C3" },
  sparkle: { count: 22, color: "#F0DCB4" },
} as const;

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Lightweight canvas particle layer. Pauses when the tab is hidden; DPR capped at 2. */
export function Particles({
  variant = "dust",
  count,
  color,
  intensity = 1,
  paused = false,
  className = "absolute inset-0",
}: ParticlesProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const fill = color ?? DEFAULTS[variant].color;
    const n = Math.min(70, Math.max(0, Math.round(count ?? DEFAULTS[variant].count)));
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = 0;
    let running = false;

    const spawn = (p: P | null, anywhere: boolean): P => {
      const q = p ?? ({} as P);
      q.phase = rand(0, Math.PI * 2);
      q.life = rand(0, 1);
      if (variant === "dust") {
        q.x = rand(0, w);
        q.y = anywhere ? rand(0, h) : h + 8;
        q.r = rand(0.5, 1.9);
        q.vx = rand(-3, 3);
        q.vy = -rand(4, 13);
        q.speed = rand(0.4, 1.1);
      } else if (variant === "petals") {
        q.x = rand(-10, w + 10);
        q.y = anywhere ? rand(0, h) : -14;
        q.r = rand(3.5, 7.5);
        q.vx = rand(-5, 5);
        q.vy = rand(9, 20);
        q.speed = rand(0.5, 1.1);
        q.rot = rand(0, Math.PI * 2);
        q.vr = rand(-0.5, 0.5);
      } else {
        q.x = rand(0, w);
        q.y = rand(0, h);
        q.r = rand(1.6, 4.2);
        q.vx = 0;
        q.vy = 0;
        q.speed = rand(0.25, 0.6);
      }
      return q;
    };

    let parts: P[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const nw = Math.max(1, Math.round(rect.width));
      const nh = Math.max(1, Math.round(rect.height));
      if (nw === w && nh === h) return;
      w = nw;
      h = nh;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (parts.length === 0) parts = Array.from({ length: n }, () => spawn(null, true));
      if (reduced || !running) draw(0);
    };

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = fill;
      for (const p of parts) {
        p.phase += dt * p.speed;
        let alpha: number;
        if (variant === "dust") {
          p.x += (p.vx + Math.sin(p.phase * 1.3) * 4) * dt;
          p.y += p.vy * dt;
          if (p.y < -10 || p.x < -10 || p.x > w + 10) spawn(p, false);
          alpha = (0.25 + 0.55 * (0.5 + 0.5 * Math.sin(p.phase * 2.1))) * Math.min(1, (h - p.y) / 60 + 0.2);
          ctx.globalAlpha = Math.max(0, Math.min(1, alpha * intensity));
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          // soft halo on the larger motes
          if (p.r > 1.3) {
            ctx.globalAlpha *= 0.1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 2.6, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (variant === "petals") {
          p.x += (p.vx + Math.sin(p.phase) * 12) * dt;
          p.y += p.vy * dt;
          p.rot += p.vr * dt;
          if (p.y > h + 16) spawn(p, false);
          alpha = 0.5 + 0.25 * Math.sin(p.phase * 0.7);
          ctx.globalAlpha = Math.max(0, Math.min(1, alpha * intensity));
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.scale(1, 0.55 + 0.4 * Math.abs(Math.sin(p.phase * 0.9)));
          ctx.beginPath();
          ctx.moveTo(0, -p.r);
          ctx.bezierCurveTo(p.r * 0.9, -p.r * 0.5, p.r * 0.7, p.r * 0.8, 0, p.r);
          ctx.bezierCurveTo(-p.r * 0.7, p.r * 0.8, -p.r * 0.9, -p.r * 0.5, 0, -p.r);
          ctx.fill();
          ctx.restore();
        } else {
          p.life += dt * p.speed;
          if (p.life >= 1) {
            spawn(p, true);
            p.life = 0;
          }
          alpha = Math.sin(p.life * Math.PI);
          ctx.globalAlpha = Math.max(0, Math.min(1, alpha * alpha * intensity));
          const r = p.r * (0.6 + 0.4 * alpha);
          const k = r * 0.16;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - r);
          ctx.quadraticCurveTo(p.x + k, p.y - k, p.x + r, p.y);
          ctx.quadraticCurveTo(p.x + k, p.y + k, p.x, p.y + r);
          ctx.quadraticCurveTo(p.x - k, p.y + k, p.x - r, p.y);
          ctx.quadraticCurveTo(p.x - k, p.y - k, p.x, p.y - r);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016);
      last = t;
      if (pausedRef.current) return;
      draw(dt);
    };

    const start = () => {
      if (running || reduced) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    resize();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    ro?.observe(canvas);
    document.addEventListener("visibilitychange", onVisibility);
    if (!document.hidden) start();
    if (reduced) draw(0);

    return () => {
      stop();
      ro?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [variant, count, color, intensity]);

  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none h-full w-full ${className}`} />;
}

export default Particles;
