import { Easing, interpolate } from "remotion";
import { MX, MY } from "./theme";

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export const prog = (f: number, start: number, dur: number, ease: (t: number) => number = (t) => t) =>
  ease(clamp((f - start) / dur));

export const eOut = Easing.bezier(0.16, 1, 0.3, 1); // --ease do site
export const eIn = Easing.bezier(0.7, 0, 0.84, 0);
export const eInOut = Easing.bezier(0.83, 0, 0.17, 1);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const map = (f: number, inp: number[], out: number[]) =>
  interpolate(f, inp, out, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// PRNG determinístico
export const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Trajetória de sucção: espiral logarítmica para o centro da boca
export const suck = (x0: number, y0: number, p: number, spin: number) => {
  const dx = x0 - MX;
  const dy = y0 - MY;
  const r0 = Math.hypot(dx, dy);
  const th0 = Math.atan2(dy, dx);
  const r = r0 * Math.pow(1 - p, 1.35);
  const th = th0 + spin * p * p;
  return { x: MX + r * Math.cos(th), y: MY + r * Math.sin(th), r };
};

// Relógio da sucção: congela no momento da conexão
export const suckClock = (f: number, freezeAt: number) => Math.min(f, freezeAt);

// Tremor de câmera com decaimento
export const shake = (f: number, at: number, amp: number, dur = 14) => {
  const t = f - at;
  if (t < 0 || t > dur) return { x: 0, y: 0 };
  const k = amp * Math.exp(-t / (dur / 3.5));
  return { x: Math.sin(t * 2.7 + at) * k, y: Math.cos(t * 3.9 + at * 0.7) * k };
};
