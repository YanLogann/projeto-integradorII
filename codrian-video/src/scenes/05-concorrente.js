// CENA 5 (17.2 → 21.2s) — Quadro de evidências: linha do tempo com fio vermelho até o concorrente.
(() => {
  const { TL, el, scene, fx, wt } = K;
  const S = scene('s-quadro', 17.2, 21.2, { push: .05, drift: -90 });
  const t0 = 17.2;

  const back = S.layer('', 20);
  el('div', 'abs', null, back).style.cssText = 'inset:-200px;background:radial-gradient(50% 40% at 50% 40%, rgba(123,44,255,.2), transparent 70%), repeating-linear-gradient(90deg, rgba(255,255,255,.025) 0 2px, transparent 2px 120px), repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 2px, transparent 2px 120px), #07040e';

  const mid = S.layer('', 40);
  // fio vermelho (SVG desenhado com stroke-dashoffset)
  const svg = el('div', 'abs', `<svg width="1080" height="2200" viewBox="0 0 1080 2200" style="overflow:visible">
     <path id="fio" d="M300 470 C 600 520, 700 620, 760 780 S 420 960, 330 1090 S 640 1150, 760 1120" fill="none" stroke="#FF3D6E" stroke-width="7" stroke-linecap="round" stroke-dasharray="2200" stroke-dashoffset="2200" style="filter:drop-shadow(0 0 10px rgba(255,61,110,.8))"/></svg>`, mid);
  svg.style.cssText = 'left:0;top:0';
  TL.to(svg.querySelector('#fio'), { attr: { 'stroke-dashoffset': 0 }, duration: 2.6, ease: 'power1.inOut' }, t0 + .2);

  const cards = [
    { x: 90, y: 380, k: '21:47', v: 'Cliente pesquisa', t: t0 + .2 },
    { x: 470, y: 760, k: '21:51', v: 'Sai do perfil do Marcos', t: t0 + .9 },
    { x: 90, y: 1010, k: '21:53', v: 'Fecha com o concorrente', t: wt('concorrente', 'fechou') },
  ];
  cards.forEach(c => {
    const d = el('div', 'card', `<div class="pin" style="left:50%;top:-14px;margin-left:-15px"></div><div class="k">${c.k}</div><div class="v">${c.v}</div>`, mid);
    Object.assign(d.style, { left: c.x + 'px', top: c.y + 'px', transform: `rotate(${(c.x > 300 ? 3 : -3)}deg)` });
    TL.from(d, { scale: 1.4, opacity: 0, duration: .3, ease: 'power3.out' }, c.t);
  });

  // +6 MIN
  const big = el('div', 'abs display grad-roxo glow-roxo', '+6 min', S.layer('', -60));
  Object.assign(big.style, { right: '70px', top: '440px', fontSize: '200px' });
  TL.from(big, { x: 200, opacity: 0, duration: .6, ease: 'expo.out' }, wt('concorrente', 'Seis'));

  // suspeito
  const sus = el('div', 'card', `
    <svg width="260" height="300" viewBox="0 0 260 300"><rect width="260" height="300" rx="18" fill="#1d1236"/><circle cx="130" cy="115" r="52" fill="#000"/><path d="M30 300 C30 215 75 185 130 185 C185 185 230 215 230 300Z" fill="#000"/><text x="130" y="140" text-anchor="middle" font-family="Anton" font-size="90" fill="#A66BFF">?</text></svg>
    <div class="k" style="margin-top:16px">SUSPEITO</div><div class="v">Concorrente</div>`, mid);
  Object.assign(sus.style, { left: '600px', top: '1040px', transform: 'rotate(4deg)' });
  TL.from(sus, { y: 200, opacity: 0, duration: .5, ease: 'expo.out' }, wt('concorrente', 'concorrente') - .2);
  const st = el('div', 'abs stamp', 'FECHOU', mid);
  Object.assign(st.style, { left: '560px', top: '1250px', fontSize: '110px', transform: 'rotate(-14deg)', mixBlendMode: 'normal' });
  TL.from(st, { scale: 2.5, opacity: 0, duration: .16, ease: 'power4.in' }, wt('concorrente', 'concorrente') + .35);
  fx.shake(S.shk, wt('concorrente', 'concorrente') + .5, 18, .3);
})();
