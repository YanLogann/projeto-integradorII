// Partitura / cue sheet. Tudo ancorado em config.js (mesmos marcos da animação). 120 BPM, A menor.
import { DURATION, T, VO, SCENES } from '../config.js';
import { createGraph, wavEncode, send, SR } from './engine.js';
import * as X from './sfx.js';

const BEAT = 0.5;
const SILENCE = [T.freeze, T.wave - 0.05];   // silêncio absoluto: 16.00 -> 17.35

async function loadVO(g, base) {
  const out = {};
  for (const [k, v] of Object.entries(VO)) {
    const ab = await (await fetch(`${base}assets/vo/${v.file}.mp3`)).arrayBuffer();
    out[k] = await g.ctx.decodeAudioData(ab);
  }
  return out;
}
const rms = (b) => { const d = b.getChannelData(0); let s = 0, n = 0; for (let i = 0; i < d.length; i += 7) { s += d[i] * d[i]; n++; } return Math.sqrt(s / n); };

function mixVO(g, bufs) {
  const c = g.ctx; const windows = [];
  for (const [k, v] of Object.entries(VO)) {
    const b = bufs[k], gain = v.gain * Math.min(0.2 / (rms(b) || 0.1), 6) * 0.62;
    const mk = (rate = 1) => { const s = c.createBufferSource(); s.buffer = b; s.playbackRate.value = rate; return s; };
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 85;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -24; comp.ratio.value = 3.5; comp.attack.value = 0.005; comp.release.value = 0.12;
    const out = c.createGain(); out.gain.value = gain;
    const s = mk(); s.connect(hp).connect(comp).connect(out).connect(g.vo); s.start(v.at);
    if (v.fx === 'deep') { const ls = c.createBiquadFilter(); ls.type = 'lowshelf'; ls.frequency.value = 220; ls.gain.value = 5; hp.disconnect(); hp.connect(ls).connect(comp); send(g, out, 0.28); }
    else if (v.fx === 'ai') { // voz da IA: dobrada, ligeiramente grave + eco/reverb
      const s2 = mk(0.94), d = c.createDelay(0.1); d.delayTime.value = 0.019; const g2 = c.createGain(); g2.gain.value = gain * 0.42; const ls = c.createBiquadFilter(); ls.type = 'lowshelf'; ls.frequency.value = 250; ls.gain.value = 4;
      s2.connect(d).connect(ls).connect(g2).connect(g.vo); s2.start(v.at); send(g, out, 0.45); send(g, g2, 0.3);
    } else if (v.fx === 'room') send(g, out, 0.16); else if (v.fx === 'narr') send(g, out, 0.1); else send(g, out, 0.04);
    windows.push([v.at, v.at + b.duration]);
  }
  return windows;
}

export async function renderMix(base = './') {
  const g = createGraph(DURATION), c = g.ctx, M = g.music, S = g.sfx;
  const bufs = await loadVO(g, base);
  const wins = mixVO(g, bufs);
  const A = (...a) => a;

  // ================= S1 — DIGITAL APOCALYPSE (0–4) =================
  X.boom(g, 0.0, { gain: 0.9 }); X.whoosh(g, 0.0, 1.0, { up: false, peak: 0.4, pan: 0.8 });
  X.drone(g, 0, 4.0, { f: 55, peak: 0.2, lp: 320 });
  [0.35, 0.9, 2.4, 3.2, 3.55].forEach((t, i) => { X.zap(g, t, { peak: 0.28 }); X.impact(g, t + 0.02, { gain: 0.35, len: 0.9, rv: 0.6 }); });
  [0.3, 1.1, 2.5, 3.6].forEach((t) => X.glitch(g, t, 0.3, { peak: 0.16 }));
  for (let i = 0; i < 8; i++) X.bass(g, 0.5 + i * BEAT, 33 + (i % 4 === 3 ? 3 : 0), 0.4, { peak: 0.26 + i * 0.01 });
  X.riser(g, 0.0, 1.15, { peak: 0.3, f0: 150, f1: 5000 });
  X.impact(g, T.headline, { gain: 1.0 }); X.impact(g, T.headline + 0.42, { gain: 0.7, len: 1.0 }); X.impact(g, T.headline + 0.84 - 0.02, { gain: 1.1, len: 1.6 }); X.glitch(g, T.headline + 0.84, 0.25, { peak: 0.2 });
  X.whoosh(g, 1.9, 1.0, { up: true, peak: 0.3, pan: 0.7 });
  for (let i = 0; i < 14; i++) X.ui(g, 0.4 + i * 0.25 + (i % 3) * 0.03, 'shim', { peak: 0.035 });  // "dinheiro evaporando"
  X.riser(g, 3.0, 4.0, { peak: 0.38 });

  // ================= S2 — THE BUSINESSMAN (4–10) =================
  X.impact(g, SCENES.s2.start, { gain: 0.8, len: 1.0 }); X.glitch(g, SCENES.s2.start - 0.02, 0.22, { peak: 0.2 });
  { // ambiente de escritório + groove cômico leve
    const n = c.createBufferSource(); n.buffer = g.noise; n.loop = true; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; const e = c.createGain(); e.gain.setValueAtTime(0, 4.0); e.gain.linearRampToValueAtTime(0.05, 4.4); e.gain.setValueAtTime(0.05, T.comicPause - 0.02); e.gain.linearRampToValueAtTime(0, T.comicPause); n.connect(lp).connect(e).connect(M); n.start(4.0); n.stop(T.comicPause + 0.1);
    for (let i = 0; i < 6; i++) X.pluck(g, 4.0 + i * 0.5, [57, 60, 64, 60, 57, 55][i], { peak: 0.05, lp: 1800 });
  }
  [T.notif1, T.notif2, T.notif3].forEach((t, i) => { X.buzz(g, t, 0.4); X.ui(g, t + 0.05, i === 2 ? 'bad' : 'ok', { peak: 0.2 }); X.whoosh(g, t - 0.1, 0.3, { up: true, peak: 0.12, f1: 4000, pan: i === 1 ? -0.8 : 0.8 }); });
  X.impact(g, T.notif3 + 0.62, { gain: 0.5, len: 0.7 });                       // carimbo "LEAD PERDIDO"
  X.drone(g, T.notif3, T.comicPause, { f: 55, peak: 0.1, lp: 260 });
  X.scratch(g, T.comicPause - 0.02);                                              // pausa cômica: arranhão + silêncio
  X.whoosh(g, T.lunch - 0.35, 0.35, { up: true, peak: 0.3, f1: 6000 });
  X.impact(g, T.lunch - 0.02, { gain: 0.75, len: 0.9 }); X.glitch(g, T.lunch, 0.18, { peak: 0.12 });
  [[57, 9.12, 0.34], [56, 9.5, 0.34], [55, 9.88, 0.2]].forEach(([m, t, d]) => X.wah(g, t, m, d + (m === 55 ? 0.35 : 0), { peak: 0.14 })); // trombone triste

  // ================= S3 — THE COMPETITOR (10–16) =================
  X.impact(g, SCENES.s3.start, { gain: 0.8, len: 1.2 }); X.glitch(g, SCENES.s3.start - 0.02, 0.22, { peak: 0.2 });
  const root = [33, 33, 36, 31];
  for (let b = 0; b < 12; b++) {
    const t = 10.0 + b * BEAT * 1;                                        // 6s = 12 beats
    X.kick(g, t, { peak: 0.6 }); X.hat(g, t + 0.25, { peak: 0.06 }); if (b % 2 === 1) X.clap(g, t, { peak: 0.18 });
    X.bass(g, t, root[Math.floor(b / 3) % 4], 0.22); X.bass(g, t + 0.25, root[Math.floor(b / 3) % 4] + 12, 0.14, { peak: 0.15 });
  }
  X.pad(g, 10.0, 6.0, [45, 52, 57, 60], { peak: 0.07, a: 1.5, lp: 1800 });
  X.whoosh(g, T.rivalSpin - 0.1, 0.8, { up: true, peak: 0.35, pan: 0.9 }); X.impact(g, T.rivalSpin + 0.6, { gain: 0.6, len: 0.9 });
  X.zap(g, T.rivalLine + 1.15, { peak: 0.14, f0: 3200 }); X.ui(g, T.rivalLine + 1.18, 'ok', { peak: 0.14 });  // "conquistado"
  for (let i = 0; i < 4; i++) X.ui(g, T.search + i * 0.2, i === 3 ? 'bad' : 'ok', { peak: 0.13 });
  X.glitch(g, T.search + 0.95, 0.35, { peak: 0.15 });
  X.riser(g, 14.9, T.freeze, { peak: 0.45, f0: 300, f1: 10000 });

  // ================= S4 — THE AI AWAKENS (16–24) =================
  // 16.00 – 17.35: SILÊNCIO ABSOLUTO (master zerado abaixo)
  X.boom(g, T.wave, { gain: 1.25 }); X.whoosh(g, T.wave, 1.8, { up: false, peak: 0.5, pan: 0.9, f1: 8000 });
  for (let i = 0; i < 6; i++) X.zap(g, T.wave + 0.05 + i * 0.09, { peak: 0.2, f0: 2600 - i * 200 });
  for (let i = 0; i < 24; i++) X.ui(g, T.wave + 0.15 + i * 0.07, 'shim', { peak: 0.05 });
  X.pad(g, T.wave, 6.0, [45, 52, 57, 64], { peak: 0.09, a: 1.0, lp: 3000, rv: 0.7 });
  X.drone(g, T.wave, T.aiOut, { f: 55, peak: 0.16, lp: 300 });
  for (let i = 0; i < 4; i++) X.ui(g, T.wave + 1.6 + i * 0.45, 'ok', { peak: 0.08 });  // linhas do log da IA
  X.impact(g, T.aiLine - 0.05, { gain: 0.4, len: 1.0 }); X.impact(g, 21.85, { gain: 0.55, len: 1.2 }); X.zap(g, 22.35, { peak: 0.14 });
  X.riser(g, T.aiOut, T.s5, { peak: 0.5, f0: 250, f1: 11000 });

  // ================= S5 — THE SOLUTION (24–34) =================
  const cuts = [T.s5, 25.4, T.cutIA, T.cutCRM, T.cutPresence, T.recap];
  cuts.forEach((t, i) => { X.impact(g, t, { gain: i === 5 ? 1.0 : 0.8, len: 1.1 }); X.glitch(g, t, 0.14, { peak: 0.1 }); X.whoosh(g, t - 0.3, 0.3, { up: true, peak: 0.22, pan: i % 2 ? -0.8 : 0.8, f1: 5000 }); });
  const prog = [57, 53, 48, 55];                                         // Am F C G (raízes: oitava de baixo)
  for (let b = 0; b < 20; b++) {                                         // 10s = 20 beats
    const t = 24.0 + b * BEAT; const bar = Math.floor(b / 4) % 4, r = prog[bar] - 24;
    X.kick(g, t, { peak: 0.62 }); X.hat(g, t + 0.25, { peak: 0.07 }); if (b % 2 === 1) X.clap(g, t, { peak: 0.22 });
    X.bass(g, t, r, 0.2, { peak: 0.3 }); X.bass(g, t + 0.25, r + (b % 4 === 3 ? 7 : 0), 0.16, { peak: 0.22 });
    for (let k = 0; k < 2; k++) X.pluck(g, t + k * 0.25, prog[bar] + [0, 7, 12, 7][(b * 2 + k) % 4] + 12, { peak: 0.06, pan: k ? 0.4 : -0.4 });
  }
  for (let i = 0; i < 6; i++) X.ui(g, 24.5 + i * 0.33, 'ok', { peak: 0.07 });                      // montagem (construção do site)
  [25.7, 25.95, 26.2, 26.45].forEach((t) => X.ui(g, t, 'shim', { peak: 0.1 }));                    // pulsos da automação
  [27.55, 28.05].forEach((t) => X.ui(g, t, 'ok', { peak: 0.12 }));                                  // mensagens do chat
  [28.85, 29.15, 29.55, 29.85].forEach((t) => X.ui(g, t, 'shim', { peak: 0.08 }));                  // cartões do funil
  X.pad(g, 30.5, 3.5, [45, 52, 57, 60], { peak: 0.08, a: 1.0 });
  X.riser(g, 32.2, 34.0, { peak: 0.5, f0: 300, f1: 12000 });
  X.whoosh(g, 33.4, 0.6, { up: true, peak: 0.35, f1: 9000 });

  // ================= S6 — CODRIAN REVEAL (34–40) =================
  // 34.0–35.0: convergência (sub grave + brilho subindo)
  X.drone(g, 34.0, 35.0, { f: 55, peak: 0.25, lp: 400 });
  for (let i = 0; i < 30; i++) X.ui(g, 34.0 + i * 0.033, 'shim', { peak: 0.03 + i * 0.002 });
  X.whoosh(g, 34.0, 1.0, { up: true, peak: 0.45, f0: 120, f1: 14000, pan: 0.6 });
  // CLÍMAX
  X.boom(g, T.reveal, { gain: 1.4, len: 4.0 }); X.impact(g, T.reveal, { gain: 1.2 }); X.whoosh(g, T.reveal, 1.2, { up: false, peak: 0.5, f1: 9000 });
  X.pad(g, T.reveal, 5.0, [45, 57, 64, 69, 72], { peak: 0.12, a: 0.2, lp: 4200, rv: 0.7 });
  [0, 0.2, 0.4, 0.6, 0.8, 1.0].forEach((d, i) => X.zap(g, T.reveal + d, { peak: 0.16, f0: 3000 - i * 250 }));
  for (let i = 0; i < 16; i++) X.pluck(g, T.reveal + 0.5 + i * 0.25, [69, 72, 76, 81][i % 4] + (i > 7 ? 12 : 0), { peak: 0.06 });
  for (let b = 0; b < 10; b++) { X.kick(g, T.reveal + 0.5 + b * BEAT, { peak: 0.5 }); X.bass(g, T.reveal + 0.5 + b * BEAT, 33, 0.3, { peak: 0.28 }); }
  // assinatura sonora da marca (brand book, Motion e som): acorde A5·E6·A6·E7 com reverb longo + escala descendente, uma nota por letra
  [880, 1318.5, 1760, 2637].forEach((f) => X.osc(g, 'sine', f, T.reveal + 0.12, 2.8, { peak: 0.07, a: 0.01, d: 2.6, rel: 0.4, rv: 0.9 }));
  [1318.5, 1174.7, 1046.5, 880, 783.99, 659.25, 587.33].forEach((f, i) => X.osc(g, 'sine', f, T.reveal + 0.2 + i * 0.085, 0.9, { peak: 0.07, a: 0.004, d: 0.8, rel: 0.2, rv: 0.6 }));
  X.impact(g, T.tagline, { gain: 0.9, len: 1.2 }); X.glitch(g, T.tagline + 0.7, 0.22, { peak: 0.1 });
  X.ui(g, T.cta, 'ok', { peak: 0.18 }); X.ui(g, T.cta + 0.12, 'shim', { peak: 0.1 });

  // ===== ducking da música durante falas =====
  M.gain.setValueAtTime(0.9, 0);
  wins.forEach(([a, b]) => { M.gain.setTargetAtTime(0.5, a - 0.05, 0.05); M.gain.setTargetAtTime(0.9, b + 0.1, 0.25); });
  // ===== silêncio absoluto (16.00–17.35) + fade final =====
  const mg = g.master.gain; mg.setValueAtTime(0.72, SILENCE[0] - 0.02); mg.linearRampToValueAtTime(0, SILENCE[0]); mg.setValueAtTime(0, SILENCE[1]); mg.setValueAtTime(0.72, SILENCE[1] + 0.05);
  mg.setValueAtTime(0.72, DURATION - 0.35); mg.linearRampToValueAtTime(0.0, DURATION - 0.02);
  // o silêncio também precisa cortar caudas de reverb/osciladores: zeramos os barramentos nessa janela
  [g.music, g.sfx, g.vo].forEach((b) => { const v = b.gain.value; b.gain.setValueAtTime(v, SILENCE[0] - 0.02); });
  const buf = await c.startRendering();
  return buf;
}
export const toWav = (buf) => wavEncode(buf);
