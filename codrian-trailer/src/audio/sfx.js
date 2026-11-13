// Instrumentos e efeitos sintetizados: whoosh, bass impact, digital glitch, electric pulse, cinematic boom, UI notification, riser, drone, kick/hat/clap, arp, pad.
import { noiseSrc, adsr, send } from './engine.js';
const note = (m) => 440 * Math.pow(2, (m - 69) / 12);

export function osc(g, type, f, t, dur, { dest, peak = 0.3, a = 0.005, d = 0.1, sus = 0, rel = 0.05, f2, lp, detune = 0, rv = 0, pan } = {}) {
  const c = g.ctx, o = c.createOscillator(), e = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = detune;
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  let n = o; if (lp) { const b = c.createBiquadFilter(); b.type = 'lowpass'; b.frequency.value = lp; b.Q.value = 0.8; o.connect(b); n = b; }
  n.connect(e); adsr(e, t, a, d, peak, sus, rel, Math.max(0, dur - a - d));
  let out = e; if (pan !== undefined) { const p = c.createStereoPanner(); p.pan.value = pan; e.connect(p); out = p; }
  out.connect(dest || g.sfx); if (rv) send(g, out, rv); o.start(t); o.stop(t + dur + rel + 0.05); return o;
}
export function whoosh(g, t, dur = 1.0, { up = true, peak = 0.35, f0 = 250, f1 = 7000, dest, rv = 0.25, pan = 0 } = {}) {
  const c = g.ctx, n = noiseSrc(g, t, dur + 0.2, t * 7), b = c.createBiquadFilter(), e = c.createGain(), p = c.createStereoPanner(); b.type = 'bandpass'; b.Q.value = 1.3;
  b.frequency.setValueAtTime(up ? f0 : f1, t); b.frequency.exponentialRampToValueAtTime(up ? f1 : f0, t + dur);
  e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(peak, t + dur * (up ? 0.85 : 0.25)); e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  p.pan.setValueAtTime(-pan, t); p.pan.linearRampToValueAtTime(pan, t + dur);
  n.connect(b).connect(e).connect(p).connect(dest || g.sfx); send(g, p, rv);
}
export function impact(g, t, { gain = 1, dest, len = 1.6, rv = 0.4 } = {}) {
  osc(g, 'sine', 120, t, len, { dest, peak: 0.9 * gain, a: 0.003, d: len * 0.9, f2: 32, rel: 0.2 });
  osc(g, 'triangle', 70, t, 0.5, { dest, peak: 0.35 * gain, a: 0.002, d: 0.4, f2: 40 });
  const c = g.ctx, n = noiseSrc(g, t, 0.6, t * 3), lp = c.createBiquadFilter(), e = c.createGain(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(5000, t); lp.frequency.exponentialRampToValueAtTime(200, t + 0.5);
  adsr(e, t, 0.002, 0.45, 0.6 * gain, 0, 0.1); n.connect(lp).connect(e).connect(dest || g.sfx); send(g, e, rv);
}
export function boom(g, t, { gain = 1, dest, len = 3.4 } = {}) {
  osc(g, 'sine', 70, t, len, { dest, peak: 1.0 * gain, a: 0.004, d: len, f2: 22, rel: 0.4 });
  osc(g, 'sawtooth', 55, t, len * 0.6, { dest, peak: 0.28 * gain, a: 0.01, d: len * 0.5, f2: 28, lp: 500, rv: 0.5 });
  impact(g, t, { gain: 0.9 * gain, dest, len: 1.8, rv: 0.7 });
  const c = g.ctx, n = noiseSrc(g, t, 2.2, 9), lp = c.createBiquadFilter(), e = c.createGain(); lp.type = 'lowpass'; lp.frequency.value = 1800; adsr(e, t, 0.004, 1.8, 0.4 * gain, 0, 0.3); n.connect(lp).connect(e).connect(dest || g.sfx); send(g, e, 0.8);
}
export function glitch(g, t, dur = 0.3, { peak = 0.2, dest } = {}) {
  const r = g.rnd, n = Math.floor(dur * 40);
  for (let i = 0; i < n; i++) { const tt = t + (i / n) * dur + r() * 0.01, f = [220, 440, 880, 1760, 3520][Math.floor(r() * 5)] * (0.7 + r() * 0.6); osc(g, r() < 0.5 ? 'square' : 'sawtooth', f, tt, 0.02 + r() * 0.025, { dest, peak: peak * (0.4 + r() * 0.6), a: 0.001, d: 0.02, rel: 0.004, pan: r() * 2 - 1 }); }
  const c = g.ctx, ns = noiseSrc(g, t, dur, 3), hp = c.createBiquadFilter(), gate = c.createGain(); hp.type = 'highpass'; hp.frequency.value = 3000;
  gate.gain.setValueAtTime(0, t); for (let i = 0; i < n; i++) gate.gain.setValueAtTime(r() < 0.55 ? peak * 0.9 : 0, t + (i / n) * dur); gate.gain.setValueAtTime(0, t + dur);
  ns.connect(hp).connect(gate).connect(dest || g.sfx);
}
export function zap(g, t, { peak = 0.25, dest, dur = 0.28, f0 = 2400 } = {}) {
  const c = g.ctx, o = c.createOscillator(), m = c.createOscillator(), mg = c.createGain(), e = c.createGain(), bp = c.createBiquadFilter();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(90, t + dur); m.type = 'square'; m.frequency.value = 55 + g.rnd() * 40; mg.gain.value = 900; m.connect(mg).connect(o.frequency);
  bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.9; adsr(e, t, 0.002, dur * 0.5, peak, 0, dur * 0.5); o.connect(bp).connect(e).connect(dest || g.sfx); send(g, e, 0.3); o.start(t); m.start(t); o.stop(t + dur + 0.1); m.stop(t + dur + 0.1);
}
export function ui(g, t, kind = 'ok', { peak = 0.16, dest } = {}) {
  const f = kind === 'ok' ? [1319, 1760] : kind === 'bad' ? [392, 311] : [1568, 2093];
  f.forEach((x, i) => osc(g, 'sine', x, t + i * 0.09, 0.22, { dest, peak, a: 0.003, d: 0.2, rel: 0.1, rv: 0.2 }));
}
export function buzz(g, t, dur = 0.4, { peak = 0.14, dest } = {}) {
  const c = g.ctx, o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), e = c.createGain(); o.type = 'square'; o.frequency.value = 140; lfo.frequency.value = 26; lg.gain.value = 0.5; const am = c.createGain(); am.gain.value = 0.5; lfo.connect(lg).connect(am.gain);
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; adsr(e, t, 0.005, dur * 0.8, peak, 0, 0.05); o.connect(lp).connect(am).connect(e).connect(dest || g.sfx); o.start(t); lfo.start(t); o.stop(t + dur + 0.1); lfo.stop(t + dur + 0.1);
}
export function riser(g, t0, t1, { peak = 0.4, dest, f0 = 200, f1 = 9000 } = {}) {
  const d = t1 - t0, c = g.ctx, n = noiseSrc(g, t0, d, 5), b = c.createBiquadFilter(), e = c.createGain(); b.type = 'bandpass'; b.Q.value = 2.2; b.frequency.setValueAtTime(f0, t0); b.frequency.exponentialRampToValueAtTime(f1, t1);
  e.gain.setValueAtTime(0.0001, t0); e.gain.exponentialRampToValueAtTime(peak, t1 - 0.02); e.gain.linearRampToValueAtTime(0, t1); n.connect(b).connect(e).connect(dest || g.sfx); send(g, e, 0.15);
  osc(g, 'sawtooth', 110, t0, d, { dest, peak: peak * 0.35, a: d * 0.9, d: 0.01, f2: 880, lp: 2500, rel: 0.02 });
}
export function drone(g, t0, t1, { f = 55, peak = 0.22, lp = 380, dest, swell = true } = {}) {
  const d = t1 - t0; [-9, 0, 8].forEach((dt, i) => { const o = osc(g, 'sawtooth', f * (i === 2 ? 2 : 1), t0, d, { dest: dest || g.music, peak: peak * (i === 2 ? 0.35 : 0.7), a: swell ? d * 0.6 : 0.4, d: 0.01, sus: 0.001, rel: 0.3, detune: dt, lp }); });
}
export function pad(g, t0, dur, chord, { peak = 0.07, a = 1.2, lp = 2600, rv = 0.5, dest } = {}) {
  chord.forEach((m, i) => [-7, 6].forEach((dt) => osc(g, 'sawtooth', note(m), t0, dur, { dest: dest || g.music, peak: peak / chord.length * 3, a, d: 0.01, sus: 0.001, rel: 0.6, detune: dt + i, lp, rv })));
}
export function kick(g, t, { peak = 0.7, dest } = {}) { osc(g, 'sine', 150, t, 0.28, { dest: dest || g.music, peak, a: 0.002, d: 0.22, f2: 42, rel: 0.05 }); }
export function hat(g, t, { peak = 0.07, open = false, dest } = {}) { const c = g.ctx, n = noiseSrc(g, t, 0.15, t * 11), hp = c.createBiquadFilter(), e = c.createGain(); hp.type = 'highpass'; hp.frequency.value = 7000; adsr(e, t, 0.001, open ? 0.12 : 0.03, peak, 0, 0.02); n.connect(hp).connect(e).connect(dest || g.music); }
export function clap(g, t, { peak = 0.3, dest } = {}) { const c = g.ctx; for (let k = 0; k < 3; k++) { const n = noiseSrc(g, t + k * 0.011, 0.2, t * 5 + k), bp = c.createBiquadFilter(), e = c.createGain(); bp.type = 'bandpass'; bp.frequency.value = 1700; bp.Q.value = 0.7; adsr(e, t + k * 0.011, 0.001, 0.09, peak, 0, 0.05); n.connect(bp).connect(e).connect(dest || g.music); send(g, e, 0.2); } }
export function bass(g, t, m, dur = 0.22, { peak = 0.32, lp = 420, dest } = {}) { osc(g, 'sawtooth', note(m), t, dur, { dest: dest || g.music, peak, a: 0.005, d: dur * 0.8, sus: 0.001, rel: 0.04, lp }); osc(g, 'sine', note(m), t, dur, { dest: dest || g.music, peak: peak * 0.9, a: 0.005, d: dur * 0.8, rel: 0.04 }); }
export function pluck(g, t, m, { peak = 0.09, dest, lp = 3800, pan = 0 } = {}) { osc(g, 'square', note(m), t, 0.16, { dest: dest || g.music, peak, a: 0.002, d: 0.14, rel: 0.03, lp, rv: 0.25, pan }); }
export function scratch(g, t) { const c = g.ctx, n = noiseSrc(g, t, 0.45, 4), bp = c.createBiquadFilter(), e = c.createGain(); bp.type = 'bandpass'; bp.Q.value = 3; bp.frequency.setValueAtTime(3500, t); bp.frequency.exponentialRampToValueAtTime(180, t + 0.4); adsr(e, t, 0.005, 0.3, 0.5, 0, 0.1); n.connect(bp).connect(e).connect(g.sfx); osc(g, 'sawtooth', 900, t, 0.4, { peak: 0.2, a: 0.005, d: 0.35, f2: 60, lp: 2000 }); }
export function wah(g, t, m, dur, { peak = 0.2 } = {}) { const c = g.ctx, o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), e = c.createGain(), bp = c.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.setValueAtTime(note(m), t); o.frequency.linearRampToValueAtTime(note(m) * 0.97, t + dur); lfo.frequency.value = 6; lg.gain.value = 9; lfo.connect(lg).connect(o.detune); bp.type = 'lowpass'; bp.frequency.setValueAtTime(400, t); bp.frequency.linearRampToValueAtTime(1600, t + dur * 0.4); bp.frequency.linearRampToValueAtTime(500, t + dur); adsr(e, t, 0.03, dur * 0.7, peak, 0.01, 0.1); o.connect(bp).connect(e).connect(g.sfx); send(g, e, 0.2); o.start(t); lfo.start(t); o.stop(t + dur + 0.2); lfo.stop(t + dur + 0.2); }
export { note };
