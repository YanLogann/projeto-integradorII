// CENA 3 (8.0 → 11.95s) — Depoimento: arquivo de áudio + conversa no direct que some.
(() => {
  const { TL, el, scene, fx, wt, rng } = K;
  const S = scene('s-depo', 8.0, 11.95, { push: .07 });
  const t0 = 8.0;

  const back = S.layer('', 20);
  el('div', 'abs', null, back).style.cssText = 'inset:0;background:linear-gradient(180deg,#0b0618,#05030a)';
  const head = el('div', 'abs mono', 'ARQUIVO 02 · DEPOIMENTO DA VÍTIMA', back);
  Object.assign(head.style, { left: '80px', top: '270px', fontSize: '30px', letterSpacing: '.18em', color: 'var(--roxo-2)' });
  TL.from(head, { clipPath: 'inset(0 100% 0 0)', duration: .5, ease: 'steps(20)' }, t0 + .05);

  // forma de onda reagindo às palavras faladas
  const wave = el('div', 'abs', null, back);
  Object.assign(wave.style, { left: '80px', right: '80px', top: '330px', height: '200px', display: 'flex', alignItems: 'center', gap: '8px' });
  const bars = Array.from({ length: 46 }, () => el('i', '', null, wave));
  bars.forEach(b => Object.assign(b.style, { flex: 1, height: '8px', background: 'var(--verde)', borderRadius: '6px', boxShadow: '0 0 14px rgba(34,229,139,.7)' }));
  const words = window.CUES.depoimento.words;
  const r = rng(33);
  for (let t = t0; t < 11.95; t += 1 / 12) {
    const active = words.some(w => t >= w.s - .03 && t <= w.e + .03);
    bars.forEach((b, i) => {
      const h = active ? 20 + r() * 170 * Math.sin((i / bars.length) * Math.PI) : 8 + r() * 6;
      TL.to(b, { height: h, duration: 1 / 12, ease: 'none' }, t);
    });
  }

  // conversa
  const mid = S.layer('', 80);
  const b1 = el('div', 'bubble in', 'Oi! Quanto fica uma reforma de banheiro?<small>21:47</small>', mid);
  Object.assign(b1.style, { left: '80px', top: '700px' });
  const b2 = el('div', 'bubble out', 'Amanhã te mando o orçamento!<small>visto · 21:48</small>', mid);
  Object.assign(b2.style, { right: '80px', top: '950px' });
  const b3 = el('div', 'abs mono', '— o cliente não respondeu —', mid);
  Object.assign(b3.style, { left: 0, right: 0, top: '1180px', textAlign: 'center', fontSize: '32px', color: 'var(--alerta)', letterSpacing: '.1em' });
  TL.from(b1, { y: 60, opacity: 0, scale: .9, duration: .45, ease: 'back.out(1.6)', transformOrigin: '0 100%' }, t0 + .25);
  TL.from(b2, { y: 60, opacity: 0, scale: .9, duration: .45, ease: 'back.out(1.6)', transformOrigin: '100% 100%' }, wt('depoimento', 'direct'));
  const ts = wt('depoimento', 'sumiu');
  // o cliente "evapora": bolha desfoca e sobe
  TL.to(b1, { opacity: 0, filter: 'blur(18px)', y: -80, duration: .6, ease: 'power2.in' }, ts);
  TL.from(b3, { opacity: 0, duration: .3 }, ts + .2);
  FX.burst(ts + .2, 360, 760, '166,107,255', 60, .5);
})();
