import * as THREE from 'three';
import gsap from 'gsap';
import { W, H, FPS, DURATION, SCENES, BRAND } from './config.js';
import { Stage } from './core/stage.js';
import { Overlay2D } from './core/overlay2d.js';
import { loadScenes } from './scenes/index.js';

const params = new URLSearchParams(location.search);
const RENDER = params.has('render');
if (RENDER) document.body.classList.add('render');

const stageEl = document.getElementById('stage');
const fit = () => { if (RENDER) return; const vp = document.getElementById('viewport'); const s = Math.min(vp.clientWidth / W, vp.clientHeight / H); stageEl.style.transform = `scale(${s})`; };
addEventListener('resize', fit); fit();

async function boot() {
  await Promise.all([...['400 40px "DM Sans"', '500 40px "DM Sans"', '700 40px "DM Sans"', '800 40px "DM Sans"', '900 40px "DM Sans"', '400 20px "Silkscreen"', '500 20px "JetBrains Mono"', '700 20px "JetBrains Mono"'].map((f) => document.fonts.load(f, 'AÇÃOcodrian0123'))]);
  await document.fonts.ready;
  const stage = new Stage(document.getElementById('gl'), W, H);
  const overlay = new Overlay2D(document.getElementById('fx2d'), W, H);
  const envelopes = await (await fetch('assets/vo/envelopes.json')).json();
  const ctx = { stage, overlay, envelopes, W, H, THREE };
  const scenes = await loadScenes(ctx);
  const scenesEl = document.getElementById('scenes');
  scenes.forEach((s) => scenesEl.appendChild(s.dom));

  // captions (legendas sincronizadas) — também entram na timeline mestre
  const { buildCaptions } = await import('./ui/captions.js');
  const capEl = document.getElementById('caption');

  const master = gsap.timeline({ paused: true });
  scenes.forEach((s) => master.add(s.tl, s.start));
  buildCaptions(master, capEl, envelopes);
  master.duration(); // materializa
  if (master.duration() < DURATION) master.set({}, {}, DURATION);

  const sceneAt = (t) => scenes.findIndex((s) => t >= s.start && t < s.end);
  function seek(t) {
    t = Math.min(Math.max(t, 0), DURATION - 1e-4);
    master.time(t, false);
    let i = sceneAt(t); if (i < 0) i = scenes.length - 1;
    const cur = scenes[i], prev = i > 0 ? scenes[i - 1] : null;
    // visibilidade do DOM por cena (com cauda para transições)
    scenes.forEach((s, k) => { const vis = t >= s.start && t < (s.domEnd ?? s.end); s.dom.style.display = vis ? 'block' : 'none'; });
    // transição (a cena atual declara como entra)
    const tr = cur.transition; let B = null, fx = {};
    let A = cur.three, Bscene = null;
    cur.update(t - cur.start, t);
    if (tr && prev && t - cur.start < tr.dur) {
      const p = (t - cur.start) / tr.dur;
      const pt = tr.prevFreeze !== undefined ? tr.prevFreeze : (t - prev.start);
      prev.update(pt, t);
      A = prev.three; Bscene = cur.three;
      fx = { mode: tr.mode, p: tr.ease ? tr.ease(p) : p, center: tr.center };
      if (tr.holdA) { fx = { mode: tr.mode, p: tr.holdA(t - cur.start), center: tr.center }; }
    }
    const post = cur.post ? cur.post(t - cur.start, t) : {};
    const postPrev = tr && prev && t - cur.start < tr.dur && prev.post ? prev.post(tr.prevFreeze ?? (t - prev.start), t) : null;
    const merged = { ...post, ...(postPrev && (fx.p || 0) < 0.5 ? postPrev : {}) };
    if (tr && tr.post && t - cur.start < tr.dur) { const o = tr.post(t - cur.start); merged.final = { ...(merged.final || {}), ...(o.final || {}) }; if (o.bloom) merged.bloom = o.bloom; }
    overlay.clear();
    const drawers = [cur]; if (Bscene && prev) drawers.unshift(prev);
    drawers.forEach((s) => s.draw2d && s.draw2d(overlay.ctx, s === cur ? t - cur.start : (tr.prevFreeze ?? t - prev.start), t));
    stage.render({ scene: A.scene, camera: A.camera }, Bscene ? { scene: Bscene.scene, camera: Bscene.camera } : null, { ...fx, time: t, ...merged });
  }

  let audioBuf = null;
  const renderAudio = async () => { if (audioBuf) return audioBuf; const { renderMix } = await import('./audio/score.js'); document.getElementById('status').textContent = 'sintetizando áudio…'; audioBuf = await renderMix('./'); document.getElementById('status').textContent = 'pronto'; return audioBuf; };
  const renderAudioWav = async () => { const { toWav } = await import('./audio/score.js'); return toWav(await renderAudio()); };
  const api = { seek, duration: DURATION, fps: FPS, scenes, master, stage, renderAudio, renderAudioWav };
  window.CODRIAN = api;
  seek(0);
  document.getElementById('status').textContent = 'pronto';

  // ---- prévia ----
  const { setupPreview } = await import('./ui/preview.js');
  setupPreview(api, { render: RENDER });
  window.CODRIAN_READY = true;
}
boot().catch((e) => { console.error(e); document.getElementById('status').textContent = 'ERRO: ' + e.message; window.CODRIAN_ERROR = String(e.stack || e); });
