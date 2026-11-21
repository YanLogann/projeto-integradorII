// Tokens exatos do design system "Codrian - ID Visual".
export const C = {
  void: '#100c1c',
  deep: '#271942',
  violet: '#6938e8',
  violetHi: '#8b6cff',
  lime: '#b7ff4a',
  ink: '#f4f1ff',
  mist: '#cfc6ee',
  muted: '#8e83b8',
};

export const FPS = 30;
export const DURATION = 810; // 27 s

// Linha do tempo (quadros a 30 fps)
export const T = {
  hookEnd: 90,
  connectEnd: 228,
  voidEnd: 330,
  revealEnd: 465,
  impact: 465,
  declare: 570,
  loopStart: 750,
};

// ease-out-expo cubic-bezier(0.16,1,0.3,1) aproximado
export const outExpo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * Math.max(0, x)));
export const outCubic = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
export const inOut = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const ramp = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));

export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
