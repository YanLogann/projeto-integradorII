// Motor de áudio (Web Audio API). Renderiza a trilha INTEIRA offline (OfflineAudioContext) — mesma saída na prévia e no export MP4.
import { mulberry32 } from '../core/math.js';

export const SR = 44100;
export function createGraph(duration) {
  const ctx = new OfflineAudioContext(2, Math.ceil(duration * SR), SR);
  const master = ctx.createGain(); master.gain.value = 0.72;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 3.2; comp.attack.value = 0.004; comp.release.value = 0.2;
  const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -2; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.05;
  master.connect(comp).connect(lim).connect(ctx.destination);
  const music = ctx.createGain(), vo = ctx.createGain(), sfx = ctx.createGain(); music.gain.value = 0.9; sfx.gain.value = 0.9;
  [music, vo, sfx].forEach((n) => n.connect(master));
  // reverb: impulso sintético (ruído estéreo com decaimento exponencial)
  const rev = ctx.createConvolver(); const len = Math.floor(SR * 2.6), ir = ctx.createBuffer(2, len, SR), r = mulberry32(99);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / len, 3.2) * (i < 900 ? i / 900 : 1); }
  rev.buffer = ir; const revIn = ctx.createGain(); revIn.gain.value = 1; const revLP = ctx.createBiquadFilter(); revLP.type = 'lowpass'; revLP.frequency.value = 5200;
  revIn.connect(rev).connect(revLP).connect(master);
  const rnd = mulberry32(2026);
  const noise = ctx.createBuffer(1, SR * 4, SR); { const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1; }
  return { ctx, master, music, vo, sfx, revIn, noise, rnd, duration };
}
/** Fonte de ruído em loop a partir do instante t. */
export function noiseSrc(g, t, dur, offset = 0) { const s = g.ctx.createBufferSource(); s.buffer = g.noise; s.loop = true; s.start(t, offset % 3); s.stop(t + dur); return s; }
/** Envelope ADSR simples numa GainNode (valores em segundos). */
export function adsr(gn, t, a, d, peak, sus = 0, rel = 0.05, hold = 0) {
  const p = gn.gain; p.cancelScheduledValues(t); p.setValueAtTime(0.0001, t); p.linearRampToValueAtTime(peak, t + a); p.exponentialRampToValueAtTime(Math.max(sus, 0.0001) + 0.0001, t + a + d);
  if (hold) p.setValueAtTime(Math.max(sus, 0.0001), t + a + d + hold); p.exponentialRampToValueAtTime(0.0001, t + a + d + hold + rel);
}
export function send(g, node, amt) { const s = g.ctx.createGain(); s.gain.value = amt; node.connect(s).connect(g.revIn); return s; }
export function wavEncode(buf) {
  const ch = buf.numberOfChannels, n = buf.length, out = new DataView(new ArrayBuffer(44 + n * ch * 2)); const w = (o, s) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); out.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVEfmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true); out.setUint32(24, buf.sampleRate, true); out.setUint32(28, buf.sampleRate * ch * 2, true); out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * ch * 2, true);
  const d = [...Array(ch)].map((_, c) => buf.getChannelData(c)); let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const s = Math.max(-1, Math.min(1, d[c][i])); out.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2; }
  return out.buffer;
}
