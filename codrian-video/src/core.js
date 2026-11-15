// Núcleo: timeline mestre (pausada, determinística), helpers de tempo e de cena.
// O render chama window.__seek(t) por quadro — nada depende de relógio real.
(() => {
  gsap.ticker.lagSmoothing(0);
  const TL = gsap.timeline({ paused: true });
  const stage = document.getElementById('stage');

  // tempo (s) da palavra falada que contém `match` dentro da fala `cue`
  function wt(cue, match, edge = 's') {
    const c = window.CUES[cue];
    if (!c) throw new Error('cue inexistente: ' + cue);
    if (!match) return c.start;
    const w = c.words.find(w => w.w.toLowerCase().includes(match.toLowerCase()));
    if (!w) throw new Error(`palavra "${match}" não encontrada em ${cue}`);
    return w[edge];
  }

  // RNG determinístico
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }

  function el(tag, cls, html, parent) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  }

  // Cria uma cena com câmera (push-in) e visibilidade controlada pela timeline.
  function scene(id, t0, t1, { push = 0.06, drift = 0 } = {}) {
    const root = el('section', 'scene', null, stage);
    root.id = id;
    const shk = el('div', 'layer', null, root); // recebe tremidas sem brigar com a câmera
    const cam = el('div', 'cam', null, shk);
    gsap.set(root, { autoAlpha: 0 });
    TL.set(root, { autoAlpha: 1 }, t0);
    TL.set(root, { autoAlpha: 0 }, t1);
    TL.fromTo(cam, { scale: 1, y: 0 }, { scale: 1 + push, y: drift, ease: 'none', duration: t1 - t0 }, t0);
    return { root, shk, cam, t0, t1, layer: (cls, depth = 0) => {
      const l = el('div', 'layer ' + (cls || ''), null, cam);
      if (depth) TL.fromTo(l, { y: 0 }, { y: -depth, ease: 'none', duration: t1 - t0 }, t0); // parallax
      return l;
    } };
  }

  // Transições reutilizáveis
  const fx = {
    flash(t, color = '#fff', dur = 0.35, peak = 1) {
      const f = el('div', 'flash', null, document.getElementById('overlay'));
      f.style.background = color;
      TL.fromTo(f, { opacity: 0 }, { opacity: peak, duration: 0.04, ease: 'none' }, t)
        .to(f, { opacity: 0, duration: dur, ease: 'power2.out' }, t + 0.04);
    },
    shake(target, t, amp = 18, dur = 0.4) {
      const r = rng(Math.floor(t * 1000));
      const n = 8; const step = dur / n;
      for (let i = 0; i < n; i++) {
        const k = 1 - i / n;
        TL.to(target, { x: (r() - .5) * amp * 2 * k, y: (r() - .5) * amp * 2 * k, duration: step, ease: 'none' }, t + i * step);
      }
      TL.to(target, { x: 0, y: 0, duration: step }, t + dur);
    },
    // fatias horizontais deslocadas (glitch 2D) sobre o palco inteiro
    glitch(t, dur = 0.35, intensity = 1) {
      const g = document.getElementById('glitch');
      const r = rng(Math.floor(t * 997));
      const frames = Math.round(dur / 0.04);
      for (let i = 0; i < frames; i++) {
        const top = r() * 90, h = 0.6 + r() * 4 * intensity;
        TL.set(g, { opacity: 1, '--gt': top + '%', '--gh': h + '%', '--gx': ((r() - .5) * 80 * intensity) + 'px', '--hue': (r() > .5 ? 0 : 1) }, t + i * 0.04);
      }
      TL.set(g, { opacity: 0 }, t + dur);
      TL.fromTo(stage, { filter: 'none' }, { filter: 'contrast(1.35) saturate(1.4)', duration: 0.04, ease: 'none' }, t)
        .set(stage, { filter: 'none' }, t + dur);
    },
  };

  window.K = { TL, stage, wt, rng, el, scene, fx };
})();
