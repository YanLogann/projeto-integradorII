// CENA 7 (24.0 → 29.0s) — "Ele foi entregue": o perfil vira um laudo com três falhas.
(() => {
  const { TL, el, scene, fx, wt } = K;
  const S = scene('s-entregue', 24.0, 29.0, { push: .06 });

  const back = S.layer('', 30);
  el('div', 'abs', null, back).style.cssText = 'inset:0;background:radial-gradient(60% 40% at 50% 30%, rgba(255,61,110,.14), transparent 70%), #06040c';

  const title = el('div', 'abs display', '<span class="mask"><span>Ele foi</span></span><span class="mask"><span class="grad-roxo glow-roxo" style="font-size:230px">entregue.</span></span>', S.layer('', 60));
  Object.assign(title.style, { left: '80px', top: '250px', fontSize: '150px' });
  TL.from(title.querySelectorAll('.mask > span'), { yPercent: 110, duration: .6, ease: 'expo.out', stagger: .12 }, wt('entregue', 'Ele'));
  TL.to(title, { scale: .62, transformOrigin: '0 0', y: 30, duration: .6, ease: 'power3.inOut' }, wt('entregue', 'Por') - .2);

  const items = [
    ['sem site', 'Site profissional', 'site'],
    ['sem prova', 'Avaliações e provas', 'prova'],
    ['sem caminho', 'Botão direto pro contato', 'caminho'],
  ];
  const mid = S.layer('', -30);
  const ws = window.CUES.entregue.words;
  items.forEach(([_, label, key], i) => {
    const row = el('div', 'card', `<div style="display:flex;align-items:center;gap:34px">
      <div style="width:110px;height:110px;border-radius:28px;background:rgba(255,61,110,.15);border:3px solid var(--alerta);display:flex;align-items:center;justify-content:center">
        <svg width="56" height="56" viewBox="0 0 56 56"><path d="M10 10 L46 46 M46 10 L10 46" stroke="#FF3D6E" stroke-width="9" stroke-linecap="round"/></svg></div>
      <div><div class="k" style="color:var(--alerta)">FALHA 0${i + 1}</div><div class="v" style="text-decoration:line-through;text-decoration-color:rgba(255,61,110,.8);text-decoration-thickness:5px">${label}</div></div></div>`, mid);
    Object.assign(row.style, { left: '80px', right: '80px', top: (620 + i * 250) + 'px', borderColor: 'rgba(255,61,110,.4)' });
    const w = ws.find(w => w.w.toLowerCase().startsWith(key));
    TL.from(row, { x: -1100, duration: .35, ease: 'expo.out' }, w.s - .15);
    fx.shake(row, w.s + .2, 12, .2);
  });
  // porta de saída: cliente (ponto verde) escapa pela direita
  const dot = el('div', 'abs', null, mid);
  dot.style.cssText = 'width:44px;height:44px;border-radius:50%;background:var(--verde);box-shadow:0 0 40px var(--verde);left:500px;top:1400px;opacity:0';
  TL.fromTo(dot, { opacity: 1, x: 0 }, { immediateRender: false, x: 700, duration: .7, ease: 'power2.in' }, 28.2);
  TL.to(S.cam, { x: -60, duration: .5, ease: 'power2.in' }, 28.5);
})();
