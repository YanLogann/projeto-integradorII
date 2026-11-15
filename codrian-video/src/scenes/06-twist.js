// CENA 6 (21.2 → 24.0s) — Virada: corte seco para o preto, tipografia palavra a palavra.
(() => {
  const { TL, el, scene, fx, wt } = K;
  const S = scene('s-twist', 21.2, 24.0, { push: .14 });

  el('div', 'abs', null, S.layer()).style.cssText = 'inset:0;background:#000';
  // luz única de cima, piscando
  const lamp = el('div', 'abs', null, S.layer());
  lamp.style.cssText = 'left:-200px;right:-200px;top:-300px;height:1500px;background:radial-gradient(45% 60% at 50% 0%, rgba(166,107,255,.35), transparent 70%)';
  TL.fromTo(lamp, { opacity: 0 }, { opacity: 1, duration: .08, repeat: 3, yoyo: true, ease: 'none' }, 21.3);

  const words = window.CUES.twist.words;
  const box = el('div', 'abs display', null, S.layer());
  Object.assign(box.style, { left: '80px', right: '80px', top: '640px', fontSize: '190px', lineHeight: '.95' });
  words.forEach((w, i) => {
    const isKey = /roubou/i.test(w.w);
    const s = el('span', isKey ? 'grad-roxo glow-roxo' : '', w.w.replace('.', ''), box);
    s.style.display = 'inline-block'; s.style.marginRight = '.22em';
    if (isKey) s.style.position = 'relative';
    TL.from(s, { opacity: 0, y: 40, scale: 1.25, filter: 'blur(10px)', duration: .25, ease: 'power3.out' }, w.s - .04);
    if (isKey) {
      // risco atravessando "roubou"
      const line = el('i', '', null, s);
      line.style.cssText = 'position:absolute;left:-10px;right:30px;top:52%;height:16px;background:var(--verde);box-shadow:0 0 30px var(--verde);transform-origin:0 50%';
      TL.from(line, { scaleX: 0, duration: .3, ease: 'power3.inOut' }, words.at(-1).e + .1);
    }
  });
  fx.glitch(23.85, .2, 1.4);
})();
