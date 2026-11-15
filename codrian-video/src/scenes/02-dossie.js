// CENA 2 (4.6 → 8.0s) — Dossiê da vítima: flash de câmera, polaroid 2D, carimbo, dados datilografados.
(() => {
  const { TL, el, scene, fx, wt } = K;
  const S = scene('s-dossie', 4.6, 8.0, { push: .08, drift: -40 });
  const t0 = 4.6;

  // mesa
  const back = S.layer('', 30);
  el('div', 'abs', null, back).style.cssText = 'inset:0;background:radial-gradient(70% 50% at 50% 40%, rgba(166,107,255,.22), transparent 70%), linear-gradient(180deg,#120a22,#07040e)';

  // pasta
  const mid = S.layer('', 70);
  const folder = el('div', 'abs paper', `
    <div class="mono" style="position:absolute;top:-62px;left:40px;background:var(--roxo);color:#fff;padding:14px 34px;border-radius:16px 16px 0 0;font-size:28px;letter-spacing:.2em">CONFIDENCIAL · CASO 047</div>
    <div class="elite" style="position:absolute;left:480px;top:120px;font-size:31px;line-height:2;width:440px" id="dossie-txt"></div>`, mid);
  Object.assign(folder.style, { left: '70px', top: '420px', width: '940px', height: '900px', transform: 'rotate(-2deg)' });

  const lines = [
    ['NOME:', 'Marcos R.'],
    ['EMPRESA:', 'Marcos Reformas'],
    ['MERCADO:', '12 anos'],
    ['CLIENTES:', 'satisfeitos'],
    ['SITE:', '<b style="color:var(--alerta)">não encontrado</b>'],
  ];
  const txt = folder.querySelector('#dossie-txt');
  lines.forEach(([k, v], i) => {
    const row = el('div', '', `<span style="opacity:.55">${k}</span> ${v}`, txt);
    TL.from(row, { clipPath: 'inset(0 100% 0 0)', duration: .45, ease: 'steps(14)' }, t0 + 0.5 + i * 0.42);
  });

  // polaroid com silhueta 2D chapada
  const pol = el('div', 'abs polaroid', `
    <svg width="300" height="360" viewBox="0 0 300 360" style="display:block;background:linear-gradient(180deg,#3a2a5c,#1a1030)">
      <circle cx="150" cy="140" r="62" fill="#0c0718"/>
      <path d="M40 360 C40 260 90 220 150 220 C210 220 260 260 260 360 Z" fill="#0c0718"/>
      <rect x="0" y="0" width="300" height="360" fill="url(#lg)" opacity=".35"/>
      <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#A66BFF"/><stop offset="1" stop-color="transparent"/></linearGradient></defs>
    </svg>
    <div class="elite" style="position:absolute;left:0;right:0;bottom:24px;text-align:center;font-size:36px;color:#1b1525">MARCOS R.</div>`, mid);
  Object.assign(pol.style, { left: '110px', top: '520px', transform: 'rotate(-7deg)' });
  TL.from(pol, { y: -900, rotation: -30, duration: .7, ease: 'back.out(1.2)' }, t0 + 0.05);

  // clipe
  const clip = el('div', 'abs', null, mid);
  Object.assign(clip.style, { left: '230px', top: '488px', width: '70px', height: '130px', border: '10px solid #b9b3c9', borderRadius: '40px', transform: 'rotate(-7deg)' });
  TL.from(clip, { opacity: 0, duration: .1 }, t0 + .6);

  // carimbo VÍTIMA
  const stamp = el('div', 'abs stamp', 'VÍTIMA', mid);
  Object.assign(stamp.style, { left: '90px', top: '880px', fontSize: '120px', transform: 'rotate(-12deg)' });
  const tv = wt('vitima', 'vítima');
  TL.from(stamp, { scale: 2.6, opacity: 0, duration: .18, ease: 'power4.in' }, tv + .15);
  fx.shake(S.shk, tv + .33, 22, .3);

  // "12 anos" destaque
  const big = el('div', 'abs display grad-verde glow-verde', '12 anos<br><span style="font-size:60px;letter-spacing:.06em">de mercado</span>', S.layer('', -60));
  Object.assign(big.style, { right: '60px', top: '1050px', fontSize: '190px', textAlign: 'right' });
  TL.from(big, { y: 120, opacity: 0, duration: .6, ease: 'expo.out' }, wt('vitima', 'Doze'));
  TL.to(big, { opacity: 0, duration: .25 }, 7.7);

  // flash de câmera fotográfica na entrada
  fx.flash(t0, '#fff', .45, .9);
})();
