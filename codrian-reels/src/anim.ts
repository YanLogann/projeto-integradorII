import {spring, random, interpolate} from 'remotion';
import {FPS} from './theme';
export const pop = (frame: number, delay = 0, damping = 9, stiffness = 220) =>
  spring({frame: frame - delay, fps: FPS, config: {damping, stiffness, mass: 0.6}});
export const jitter = (f: number, amp: number, seed = 's') => ({
  x: (random(seed + 'x' + f) - 0.5) * 2 * amp,
  y: (random(seed + 'y' + f) - 0.5) * 2 * amp,
});
export const lerp = (f: number, a: number, b: number, from: number, to: number) =>
  interpolate(f, [a, b], [from, to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
export const mouthFlap = (f: number, on = true) => (on ? 0.3 + 0.7 * Math.abs(Math.sin(f * 0.85)) : 0);
