// Design de som e trilha 100% sintetizados aqui (originais, sem licença de terceiros).
// Gera audio/sfx/*.wav e audio/music.wav seguindo a estrutura da timeline.
import fs from 'node:fs';
const SR = 44100, TAU = Math.PI * 2;
const buf = (sec) => new Float32Array(Math.ceil(sec * SR));
let seed = 1; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; const noise = () => rnd() * 2 - 1;
const wav = (file, chans) => {
  const n = chans[0].length, nc = chans.length, b = Buffer.alloc(44 + n * nc * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * nc * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(nc, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * nc * 2, 28); b.writeUInt16LE(nc * 2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * nc * 2, 40);
  let peak = 0; for (const c of chans) for (const v of c) peak = Math.max(peak, Math.abs(v)); const g = peak > 0.98 ? 0.98 / peak : 1;
  for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, chans[c][i] * g)) * 32767), 44 + (i * nc + c) * 2);
  fs.writeFileSync(file, b);
};
// biquad (RBJ)
const biquad = (x, type, f, q = 0.707) => {
  const w = TAU * f / SR, a = Math.sin(w) / (2 * q), c = Math.cos(w); let b0, b1, b2, a0, a1, a2;
  if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; } else if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; } else { b0 = a; b1 = 0; b2 = -a; }
  a0 = 1 + a; a1 = -2 * c; a2 = 1 - a;
  const y = new Float32Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) { const v = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v; }
  return y;
};
const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));
const reverb = (x, mix = 0.3, size = 1) => {
  const combs = [1557, 1617, 1491, 1422].map((d) => Math.round(d * size)), out = new Float32Array(x.length);
  for (const d of combs) { const bf = new Float32Array(d); let k = 0, lp = 0; for (let i = 0; i < x.length; i++) { const o = bf[k]; lp = o * 0.7 + lp * 0.3; bf[k] = x[i] + lp * 0.8; k = (k + 1) % d; out[i] += o / 4; } }
  for (const d of [225, 556]) { const bf = new Float32Array(d); let k = 0; for (let i = 0; i < x.length; i++) { const bv = bf[k], v = -out[i] + bv; bf[k] = out[i] + bv * 0.5; out[i] = v; k = (k + 1) % d; } }
  return x.map((v, i) => v * (1 - mix) + out[i] * mix);
};
const add = (dst, src, at = 0, g = 1) => { const o = Math.round(at * SR); for (let i = 0; i < src.length && o + i < dst.length; i++) if (o + i >= 0) dst[o + i] += src[i] * g; };
const gen = (sec, fn) => { const b = buf(sec); for (let i = 0; i < b.length; i++) b[i] = fn(i / SR, i); return b; };
const sweep = (sec, f0, f1, fn = Math.sin) => { const b = buf(sec); let ph = 0; for (let i = 0; i < b.length; i++) { const t = i / SR; ph += TAU * (f0 * Math.pow(f1 / f0, t / sec)) / SR; b[i] = fn(ph); } return b; };

fs.mkdirSync('audio/sfx', { recursive: true });
const S = {};
S.ring = gen(1.0, (t) => { const on = t < 0.42 || (t > 0.55 && t < 0.98); if (!on) return 0; const am = Math.sin(TAU * 22 * t) > 0 ? 1 : 0.35; return am * 0.5 * (Math.sin(TAU * 1040 * t) + 0.6 * Math.sin(TAU * 1570 * t) + 0.3 * Math.sin(TAU * 2500 * t)) * Math.min(1, (t % 0.55) * 60); });
S.ring = reverb(S.ring, 0.2, 0.5);
const clickT = (len, f) => { const b = gen(len, (t) => noise() * Math.exp(-t / 0.004) * 0.8 + Math.sin(TAU * f * t) * Math.exp(-t / 0.04)); return b; };
S.pickup = clickT(0.2, 90);
S.hangup = gen(0.35, (t) => noise() * Math.exp(-t / 0.006) + Math.sin(TAU * 70 * t) * Math.exp(-t / 0.06) * 1.2);
S.busy = gen(0.62, (t) => ((t % 0.22) < 0.13 ? Math.sin(TAU * 425 * t) * 0.6 : 0));
S.slap = (() => { const n = biquad(gen(0.25, () => noise()), 'bp', 2200, 0.8); return gen(0.25, (t, i) => n[i] * 2.2 * Math.exp(-t / 0.03) + Math.sin(TAU * 120 * t) * Math.exp(-t / 0.05) * 0.9); })();
S.whoosh = (() => { const n = gen(0.7, () => noise()); const y = new Float32Array(n.length); let lp = 0; for (let i = 0; i < n.length; i++) { const t = i / SR, f = 300 + 3000 * Math.sin(Math.PI * t / 0.7); const a = 1 - Math.exp(-TAU * f / SR); lp += (n[i] - lp) * a; y[i] = lp * Math.sin(Math.PI * t / 0.7) ** 2 * 1.4; } return y; })();
S.typing = (() => { const b = buf(0.85); for (let k = 0; k < 11; k++) add(b, biquad(gen(0.03, (t) => noise() * Math.exp(-t / 0.005)), 'hp', 2500), k * 0.075 + rnd() * 0.02, 0.6); return b; })();
S.tap = sweep(0.08, 900, 400).map((v, i) => v * Math.exp(-i / SR / 0.025));
S.darkhit = (() => { const b = sweep(2.5, 80, 32).map((v, i) => v * env(i / SR, 0.005, 0.7)); const r = biquad(gen(2.5, (t) => noise() * env(t, 0.01, 0.5)), 'lp', 300); return reverb(b.map((v, i) => v + r[i] * 0.8), 0.35); })();
S.pop = (() => { const b = sweep(0.12, 300, 1000).map((v, i) => v * Math.exp(-i / SR / 0.04)); return b.map((v, i) => v + noise() * Math.exp(-i / SR / 0.004) * 0.4); })();
S.fall = sweep(0.55, 1300, 260).map((v, i) => v * 0.4 * Math.sin(Math.PI * i / SR / 0.55));
S.freeze = reverb(gen(1.6, (t) => Math.sin(TAU * 55 * t) * env(t, 0.003, 0.18) * 1.2 + noise() * Math.exp(-t / 0.02) * 0.6 + Math.sin(TAU * 2093 * t) * env(t, 0.002, 0.5) * 0.3 + Math.sin(TAU * 3136 * t) * env(t, 0.002, 0.35) * 0.15), 0.4);
S.rise = reverb(gen(1.0, (t) => { const a = (t / 1.0) ** 2 * (t < 0.95 ? 1 : (1 - t) * 20); return a * 0.25 * [523, 659, 784, 1047, 1319].reduce((s, f, k) => s + Math.sin(TAU * f * t * (1 + t * 0.03)) * (1 + 0.5 * Math.sin(TAU * (5 + k) * t)), 0); }), 0.5);
S.tear = (() => { const n = biquad(gen(0.7, () => noise()), 'bp', 2800, 0.6); let c = 0; return n.map((v, i) => { if (i % 220 === 0) c = rnd() > 0.35 ? rnd() : 0.1; const t = i / SR; return v * c * 2.4 * Math.sin(Math.PI * Math.min(1, t / 0.7)); }); })();
S.thump = gen(0.4, (t) => Math.sin(TAU * (90 - 40 * t) * t) * env(t, 0.003, 0.1) * 1.2 + noise() * Math.exp(-t / 0.01) * 0.3);
S.snap = gen(0.18, (t) => noise() * Math.exp(-t / 0.003) * 0.7 + Math.sin(TAU * 1700 * t) * Math.exp(-t / 0.018) * 0.5 + Math.sin(TAU * 150 * t) * Math.exp(-t / 0.035) * 0.8);
S.click = (() => { const b = buf(0.12); add(b, clickT(0.05, 2000), 0, 0.5); add(b, clickT(0.05, 1600), 0.06, 0.4); return b; })();
S.chime = reverb(gen(1.6, (t) => [[1047, 0], [1319, 0.08], [1568, 0.16], [2093, 0.24]].reduce((s, [f, d]) => s + (t > d ? Math.sin(TAU * f * (t - d)) * env(t - d, 0.003, 0.35) : 0), 0) * 0.35), 0.4);
S.bell = reverb(gen(1.4, (t) => [0, 0.16].reduce((s, d) => s + (t > d ? (Math.sin(TAU * 2100 * (t - d)) + 0.6 * Math.sin(TAU * 2660 * (t - d))) * env(t - d, 0.002, 0.3) : 0), 0) * 0.35), 0.3);
S.ding = reverb(gen(0.8, (t) => (Math.sin(TAU * 1320 * t) + 0.5 * Math.sin(TAU * 1980 * t)) * env(t, 0.003, 0.18) * 0.5), 0.25);
S.flutter = (() => { const b = buf(1.1); for (let k = 0; k < 60; k++) { const at = Math.pow(rnd(), 0.6) * 1.0; add(b, biquad(gen(0.03, (t) => noise() * Math.exp(-t / 0.006)), 'bp', 1500 + rnd() * 2500, 1), at, 0.4 + rnd() * 0.4); } return b; })();
S.logohit = (() => {
  const b = gen(3.6, (t) => Math.sin(TAU * (60 - 22 * Math.min(t, 1)) * t) * env(t, 0.004, 0.6) * 1.3 + [261.6, 329.6, 392, 523.3, 784].reduce((s, f, k) => s + Math.sin(TAU * f * t + k) * env(t, 0.01, 1.2) * 0.16, 0));
  const n = biquad(gen(3.6, (t) => noise() * env(t, 0.002, 0.08)), 'lp', 4000);
  return reverb(b.map((v, i) => v + n[i] * 0.8), 0.45, 1.2);
})();
for (const [k, v] of Object.entries(S)) wav(`audio/sfx/${k}.wav`, [v]);

// ---------------- TRILHA ----------------
const DUR = 34.5, L = buf(DUR), R = buf(DUR);
const nf = (m) => 440 * Math.pow(2, (m - 69) / 12); // midi -> Hz
const stereo = (src, at, g = 1, pan = 0) => { add(L, src, at, g * (1 - Math.max(0, pan))); add(R, src, at, g * (1 + Math.min(0, pan))); };
const saw = (ph) => ((ph / TAU) % 1) * 2 - 1;
const pad = (notes, sec, cutoff, g = 0.12, atk = 0.6, rel = 0.8) => {
  const b = buf(sec + rel);
  for (const m of notes) for (const dt of [-0.12, 0, 0.11]) { let ph = rnd() * TAU; const f = nf(m) * Math.pow(2, dt / 12); for (let i = 0; i < b.length; i++) { ph += TAU * f / SR; const t = i / SR; const e = Math.min(1, t / atk) * (t > sec ? Math.max(0, 1 - (t - sec) / rel) : 1); b[i] += saw(ph) * e * g / 3; } }
  return biquad(biquad(b, 'lp', cutoff), 'lp', cutoff * 1.4);
};
const pluck = (m, g = 0.3, dec = 0.996) => { // Karplus-Strong
  const f = nf(m), N = Math.round(SR / f), line = Float32Array.from({ length: N }, () => noise()), b = buf(1.6); let k = 0;
  for (let i = 0; i < b.length; i++) { const nx = (k + 1) % N; const v = (line[k] + line[nx]) * 0.5 * dec; b[i] = line[k] * g; line[k] = v; k = nx; }
  return b;
};
const kick = (g = 0.8) => sweep(0.35, 130, 42).map((v, i) => v * env(i / SR, 0.002, 0.11) * g);
const clap = (g = 0.3) => biquad(gen(0.2, (t) => noise() * (Math.exp(-t / 0.012) + 0.5 * Math.exp(-Math.max(0, t - 0.015) / 0.04))), 'bp', 1400, 0.7).map((v) => v * g);
const tick = (g = 0.15) => biquad(gen(0.04, (t) => noise() * Math.exp(-t / 0.004)), 'hp', 3000).map((v) => v * g);
const B = 0.6; // 100 bpm

// A — tensão (0–4.5): drone grave + relógio
stereo(pad([33, 45], 4.4, 260, 0.35, 0.3, 0.3), 0, 0.9);
stereo(pad([58, 64], 4.4, 1400, 0.05, 1.2, 0.3), 0, 0.8);
for (let t = 0.3; t < 4.5; t += B) stereo(tick(), t, 1, 0.3);
// B — concorrência (4.5–9.8): pulso cardíaco + pad menor
stereo(pad([45, 48, 52], 5.3, 700, 0.14, 0.5, 0.4), 4.5, 0.9);
stereo(pad([33], 5.3, 200, 0.3, 0.3, 0.3), 4.5, 0.9);
for (let t = 4.5; t < 9.8; t += B * 2) { stereo(kick(0.55), t); stereo(kick(0.35), t + 0.18); }
// C — cemitério (9.8–14.5): diminuto, mais escuro, metais graves
stereo(pad([45, 48, 51], 4.6, 600, 0.16, 0.8, 0.1), 9.8, 1);
stereo(pad([33, 39], 4.6, 350, 0.3, 1.5, 0.1), 9.8, 1);
for (let t = 9.8; t < 14.45; t += B * 1.5) { stereo(kick(0.6), t); stereo(kick(0.4), t + 0.16); }
for (const [t, m] of [[10.4, 69], [11.6, 68], [12.8, 67], [14.0, 63]]) stereo(pluck(m, 0.16, 0.993), t, 1, 0.4);
// (14.5–14.8 silêncio: congelamento)
// D — transformação (14.8–23.2): arpejos crescendo F–G–Am–C
const chords = [[14.8, [53, 57, 60, 65]], [17.2, [55, 59, 62, 67]], [19.6, [57, 60, 64, 69]], [22.0, [60, 64, 67, 72]]];
chords.forEach(([t0, ch], ci) => {
  const len = ci < 3 ? 2.4 : 1.2;
  stereo(pad(ch.slice(0, 3), len, 900 + ci * 500, 0.1 + ci * 0.02, 0.4, 0.3), t0, 1);
  stereo(pad([ch[0] - 24], len, 220, 0.3, 0.2, 0.2), t0, 0.9);
  for (let k = 0; t0 + k * B / 2 < t0 + len - 0.01; k++) stereo(pluck(ch[k % 4] + 12, 0.12 + ci * 0.05), t0 + k * B / 2, 1, k % 2 ? 0.35 : -0.35);
  if (ci >= 2) for (let t = t0; t < t0 + len - 0.01; t += B) stereo(kick(0.6), t);
});
stereo(gen(1.0, (t) => noise() * (t / 1.0) ** 3 * 0.25), 22.2, 1); // riser
// E — empresa viva (23.2–29.4): groove quente
const prog = [[23.2, [48, 52, 55]], [25.6, [43, 47, 50, 55]], [28.0, [45, 48, 52]]];
prog.forEach(([t0, ch], ci) => {
  const len = ci < 2 ? 2.4 : 1.4;
  stereo(pad(ch.map((m) => m + 12), len, 1800, 0.09, 0.15, 0.3), t0, 1);
  for (let t = t0, k = 0; t < t0 + len - 0.01; t += B / 2, k++) { stereo(pluck(ch[0] - 12 + (k % 2 ? 12 : 0), 0.22, 0.99), t, 1); if (k % 2 === 0) stereo(kick(0.65), t); if (k % 4 === 2) stereo(clap(0.35), t, 1, 0.1); stereo(pluck(ch[k % ch.length] + 24, 0.08), t + 0.15, 1, k % 2 ? 0.4 : -0.4); }
});
// F — respiro + subida (29.4–30.75)
stereo(gen(1.3, (t) => noise() * (t / 1.3) ** 2.5 * 0.3), 29.45, 1);
stereo(sweep(1.3, 200, 1600).map((v, i) => v * (i / SR / 1.3) ** 2 * 0.12), 29.45, 1);
// G — marca (30.75–fim): acorde maior grande
stereo(pad([36, 48, 55, 60, 64, 67, 72], 3.0, 2200, 0.1, 0.02, 0.8), 30.75, 1);
stereo(pad([24], 3.0, 160, 0.35, 0.02, 0.8), 30.75, 1);
for (const [t, m] of [[31.55, 72], [31.95, 76], [32.8, 79], [33.2, 84]]) stereo(pluck(m, 0.14), t, 1, 0.2);
const Lr = reverb(L, 0.22, 1.1), Rr = reverb(R, 0.22, 1.15);
// corte seco do congelamento (14.5–14.8) e fade final
for (let i = 0; i < Lr.length; i++) { const t = i / SR; let g = 1; if (t > 14.48 && t < 14.8) g = Math.max(0, 1 - (t - 14.48) / 0.02); if (t > 33.6) g *= Math.max(0, 1 - (t - 33.6) / 0.9); Lr[i] *= g; Rr[i] *= g; }
wav('audio/music.wav', [Lr, Rr]);
console.log('sfx:', Object.keys(S).length, 'music: ok');
