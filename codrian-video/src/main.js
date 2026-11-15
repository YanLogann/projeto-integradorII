// Ponto de entrada: expõe __seek(t) para o render quadro a quadro e um modo de pré-visualização.
(() => {
  const { TL } = K;
  const vp = document.getElementById('viewport');
  const params = new URLSearchParams(location.search);

  window.__seek = t => { TL.seek(t, false); drawFX(t); };
  window.__duration = window.DURACAO;

  // Pré-visualização no navegador: abre src/index.html?preview (toca o áudio mixado se existir)
  if (params.has('preview') || !navigator.webdriver) {
    const fit = () => { const s = Math.min(innerWidth / 1080, innerHeight / 1920); vp.style.transform = `scale(${s})`; };
    fit(); addEventListener('resize', fit);
    const audio = new Audio('../out/audio-mix.wav');
    let t0 = null;
    const loop = now => {
      const t = audio.currentTime || (t0 == null ? (t0 = now, 0) : (now - t0) / 1000);
      __seek(t % window.DURACAO);
      requestAnimationFrame(loop);
    };
    addEventListener('click', () => audio.play().catch(() => {}), { once: true });
    requestAnimationFrame(loop);
  }

  document.fonts.ready.then(() => { __seek(0); window.__ready = true; });
})();
