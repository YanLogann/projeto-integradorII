// Prévia no navegador: play/pause/scrub, relógio de áudio. O áudio é renderizado offline pelo mesmo motor do export.
export function setupPreview(api, { render }) {
  if (render) return;
  const $ = (id) => document.getElementById(id);
  const play = $('play'), scrub = $('scrub'), clock = $('clock');
  let playing = false, t0 = 0, base = 0, raf = 0, actx = null, src = null, aStart = 0;
  const set = (t) => { api.seek(t); scrub.value = t; clock.textContent = `${t.toFixed(2)} / ${api.duration.toFixed(2)}`; };
  const clockNow = () => (actx && src ? base + (actx.currentTime - aStart) : base + (performance.now() - t0) / 1000);
  const stopAudio = () => { try { src && src.stop(); } catch {} src = null; };
  const tick = () => { if (!playing) return; const t = clockNow(); if (t >= api.duration) { playing = false; stopAudio(); play.textContent = '▶ Play'; return; } set(t); raf = requestAnimationFrame(tick); };
  play.onclick = async () => {
    playing = !playing; play.textContent = playing ? '⏸ Pause' : '▶ Play'; stopAudio();
    if (playing) { base = parseFloat(scrub.value); if (base >= api.duration - 0.1) base = 0; t0 = performance.now();
      if ($('sound').checked) { try { const buf = await api.renderAudio(); actx = actx || new AudioContext(); await actx.resume(); src = actx.createBufferSource(); src.buffer = buf; src.connect(actx.destination); aStart = actx.currentTime; t0 = performance.now(); src.start(0, base); } catch (e) { console.warn('áudio indisponível', e); src = null; } }
      tick(); } };
  scrub.oninput = () => { playing = false; stopAudio(); play.textContent = '▶ Play'; set(parseFloat(scrub.value)); };
  addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); play.click(); } if (e.code === 'ArrowRight') set(Math.min(api.duration - 0.04, parseFloat(scrub.value) + 1 / 30)); if (e.code === 'ArrowLeft') set(Math.max(0, parseFloat(scrub.value) - 1 / 30)); });
}
