"use client";

import { useEffect, useRef } from "react";

const TONES = ["#f4b7c3", "#c98d93", "#d7b47b", "#ffffff", "#e9a0b1", "#f0dcb4", "#b3123f"];
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** A single, soft fall of paper confetti: a few dozen pieces, then it is over. */
export function Confetti({ count = 34, className = "absolute inset-0" }: { count?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const parts = Array.from({ length: count }, (_, i) => ({
      x: rand(0, w),
      y: rand(-h * 0.45, -10),
      vy: rand(70, 150),
      sway: rand(8, 26),
      phase: rand(0, 6.28),
      spin: rand(1.2, 3.4),
      rot: rand(0, 6.28),
      vr: rand(-1.4, 1.4),
      s: rand(3, 5.5),
      round: i % 4 === 0,
      // ruby is the rare accent
      tone: TONES[i % 11 === 0 ? 6 : i % 6],
    }));

    const TOTAL = 7;
    let raf = 0;
    let last = 0;
    let t = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      t += dt;
      ctx.clearRect(0, 0, w, h);
      const fade = t > TOTAL - 2 ? Math.max(0, (TOTAL - t) / 2) : 1;
      for (const p of parts) {
        p.phase += dt * p.spin;
        p.y += p.vy * dt;
        p.x += Math.sin(p.phase * 0.6) * p.sway * dt;
        p.rot += p.vr * dt;
        if (p.y < -8 || p.y > h + 10) continue;
        ctx.globalAlpha = 0.85 * fade;
        ctx.fillStyle = p.tone;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(p.phase));
        ctx.beginPath();
        if (p.round) ctx.arc(0, 0, p.s * 0.6, 0, Math.PI * 2);
        else ctx.rect(-p.s * 0.45, -p.s, p.s * 0.9, p.s * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      if (t < TOTAL) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, w, h);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [count]);

  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none h-full w-full ${className}`} />;
}
