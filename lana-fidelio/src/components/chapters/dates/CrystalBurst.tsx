"use client";

import { useEffect, useRef } from "react";

interface Shard {
  x: number; y: number; vx: number; vy: number;
  rot: number; vr: number; size: number;
  life: number; ttl: number; delay: number;
  pts: number[]; tone: string; petal: boolean;
}
interface Mote {
  x: number; y: number; vx: number; vy: number;
  r: number; life: number; ttl: number; phase: number; star: boolean;
}
interface Petal {
  x: number; y: number; vx: number; vy: number;
  r: number; rot: number; vr: number; life: number; ttl: number; phase: number; tone: string;
}

const RUBY = ["#850c30", "#b3123f", "#5a0820", "#c2254f", "#9c1038"];
const PINK = ["#f4a3b5", "#ee8fa6", "#f7c3cd", "#e27f99"];
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const smooth = (a: number, b: number, v: number) => {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * The signature transition, drawn once: ruby crystal shards burst from the centre, shed
 * champagne glitter, and each shard softens into a pink paper petal that drifts away.
 * Stops its own animation loop when everything has faded.
 */
export function CrystalBurst({ originY = 0.44, className = "absolute inset-0" }: { originY?: number; className?: string }) {
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
    const cx = w / 2;
    const cy = h * originY;

    const shards: Shard[] = Array.from({ length: 30 }, (_, i) => {
      const a = rand(0, Math.PI * 2);
      const sp = rand(110, 430);
      const n = Math.random() < 0.55 ? 3 : 4;
      const pts: number[] = [];
      for (let k = 0; k < n; k++) {
        const pa = (k / n) * Math.PI * 2 + rand(-0.35, 0.35);
        const pr = rand(0.55, 1.15);
        pts.push(Math.cos(pa) * pr, Math.sin(pa) * pr * rand(0.55, 1));
      }
      return {
        x: cx + Math.cos(a) * rand(0, 46), y: cy + Math.sin(a) * rand(0, 30),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.9 - 30,
        rot: rand(0, 6.28), vr: rand(-3.2, 3.2), size: rand(9, 25),
        life: 0, ttl: rand(1.5, 2.3), delay: rand(0, 0.22),
        pts, tone: RUBY[i % RUBY.length], petal: false,
      };
    });
    const motes: Mote[] = Array.from({ length: 74 }, () => {
      const a = rand(0, Math.PI * 2);
      const sp = rand(40, 520);
      return {
        x: cx + Math.cos(a) * rand(0, 30), y: cy + Math.sin(a) * rand(0, 20),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20,
        r: rand(0.7, 2.3), life: -rand(0, 0.25), ttl: rand(1.8, 3.2), phase: rand(0, 6.28),
        star: Math.random() < 0.28,
      };
    });
    const petals: Petal[] = [];

    let raf = 0;
    let last = 0;
    let t = 0;

    const frame = (now: number) => {
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      t += dt;
      ctx.clearRect(0, 0, w, h);
      let alive = 0;
      const drag = Math.exp(-1.7 * dt);

      for (const s of shards) {
        if (t < s.delay) { alive++; continue; }
        s.life += dt / s.ttl;
        if (s.life >= 1) continue;
        alive++;
        s.vx *= drag; s.vy *= drag; s.vy += 26 * dt;
        s.x += s.vx * dt; s.y += s.vy * dt; s.rot += s.vr * dt;
        if (!s.petal && s.life > 0.58) {
          s.petal = true;
          petals.push({
            x: s.x, y: s.y, vx: s.vx * 0.4 + rand(-8, 8), vy: rand(6, 22),
            r: rand(4.5, 8.5), rot: s.rot, vr: rand(-0.8, 0.8), life: 0, ttl: rand(3.2, 4.6),
            phase: rand(0, 6.28), tone: PINK[petals.length % PINK.length],
          });
        }
        const alpha = Math.min(1, s.life / 0.06) * (1 - smooth(0.42, 1, s.life));
        const sc = s.size * (1 - 0.55 * s.life);
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(s.pts[0] * sc, s.pts[1] * sc);
        for (let k = 2; k < s.pts.length; k += 2) ctx.lineTo(s.pts[k] * sc, s.pts[k + 1] * sc);
        ctx.closePath();
        ctx.fillStyle = s.tone;
        ctx.fill();
        // lit facet + crisp edge: reads as cut crystal on dark and on pink
        ctx.globalAlpha = alpha * 0.42;
        ctx.beginPath();
        ctx.moveTo(s.pts[0] * sc, s.pts[1] * sc);
        ctx.lineTo(s.pts[2] * sc, s.pts[3] * sc);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fillStyle = "#ffd3dd";
        ctx.fill();
        ctx.globalAlpha = alpha * 0.6;
        ctx.strokeStyle = "#f6c6d0";
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(s.pts[0] * sc, s.pts[1] * sc);
        for (let k = 2; k < s.pts.length; k += 2) ctx.lineTo(s.pts[k] * sc, s.pts[k + 1] * sc);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      for (const m of motes) {
        m.life += dt / m.ttl;
        if (m.life < 0) { alive++; continue; }
        if (m.life >= 1) continue;
        alive++;
        m.vx *= drag; m.vy *= drag; m.vy += 14 * dt;
        m.x += m.vx * dt; m.y += m.vy * dt; m.phase += dt * 9;
        // champagne on the dark, deepening to rose gold as the room turns pink
        const k = smooth(0.25, 0.8, m.life);
        const r = Math.round(246 + (201 - 246) * k);
        const g = Math.round(226 + (120 - 226) * k);
        const b = Math.round(184 + (136 - 184) * k);
        const alpha = Math.min(1, m.life / 0.05) * (1 - smooth(0.6, 1, m.life)) * (0.55 + 0.45 * Math.sin(m.phase));
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath();
        if (m.star) {
          const q = m.r * 2.6;
          const kk = q * 0.16;
          ctx.moveTo(m.x, m.y - q);
          ctx.quadraticCurveTo(m.x + kk, m.y - kk, m.x + q, m.y);
          ctx.quadraticCurveTo(m.x + kk, m.y + kk, m.x, m.y + q);
          ctx.quadraticCurveTo(m.x - kk, m.y + kk, m.x - q, m.y);
          ctx.quadraticCurveTo(m.x - kk, m.y - kk, m.x, m.y - q);
        } else {
          ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      for (const p of petals) {
        p.life += dt / p.ttl;
        if (p.life >= 1) continue;
        alive++;
        p.phase += dt;
        p.vx *= Math.exp(-0.9 * dt);
        p.x += (p.vx + Math.sin(p.phase * 1.4) * 14) * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        ctx.globalAlpha = smooth(0, 0.18, p.life) * (1 - smooth(0.7, 1, p.life)) * 0.85;
        ctx.fillStyle = p.tone;
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
      }
      ctx.globalAlpha = 1;

      if (alive > 0) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, w, h);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [originY]);

  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none h-full w-full ${className}`} />;
}
