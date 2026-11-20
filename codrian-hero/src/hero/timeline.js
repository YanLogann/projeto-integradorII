import { useTransform, cubicBezier } from "motion/react";

export const DURATION = 15; // segundos

export const easeInOut = cubicBezier(0.65, 0, 0.35, 1);
export const easeOut = cubicBezier(0.16, 1, 0.3, 1);
export const linear = (v) => v;

const toProgress = (sec) => sec / DURATION;

/**
 * Mapeia o progresso (0..1) usando marcos em SEGUNDOS da cena de 15s.
 * useTL(p, [0, 2], [0.7, 1]) => vai de 0.7 a 1 entre 0s e 2s.
 */
export function useTL(progress, seconds, values, ease = easeInOut) {
  return useTransform(progress, seconds.map(toProgress), values, {
    ease,
    clamp: true,
  });
}

/** Fade + subida padrão para textos: entra em `inAt`, sai em `outAt`. */
export function useReveal(progress, inAt, outAt, { dist = 40, fade = 0.45 } = {}) {
  const hasOut = outAt != null;
  const secs = hasOut
    ? [inAt, inAt + fade, outAt - fade, outAt]
    : [inAt, inAt + fade];
  const opacity = useTL(progress, secs, hasOut ? [0, 1, 1, 0] : [0, 1], easeOut);
  const y = useTL(progress, secs, hasOut ? [dist, 0, 0, -dist * 0.6] : [dist, 0], easeOut);
  return { opacity, y };
}
