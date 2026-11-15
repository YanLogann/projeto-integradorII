// CENA 10 (37.4 → 40.4s) — "Caso encerrado": carimbo verde e revelação da marca CODRIAN.
(() => {
  const { TL, el, scene, fx, wt } = K;
  const S = scene('s-encerrado', 37.4, 40.4, { push: .06 });
  const tStamp = wt('encerrado', 'encerrado');
  const tLogo = wt('encerrado', 'CODRIAN');

  const back = S.layer('', 30);
  el('div', 'abs', null, back).style.cssText = 'inset:0;background:radial-gradient(60% 40% at 50% 45%, rgba(123,44,255,.4), transparent 70%), #05030b';

  const mid = S.layer('', 20);
  const st = el('div', 'abs stamp verde', 'Caso encerrado', mid);
  Object.assign(st.style, { left: '50%', top: '520px', fontSize: '120px', whiteSpace: 'nowrap', transform: 'translateX(-50%) rotate(-6deg)' });
  TL.from(st, { scale: 2.6, opacity: 0, duration: .18, ease: 'power4.in' }, tStamp + .05);
  fx.shake(S.shk, tStamp + .23, 26, .35);
  TL.to(st, { y: -170, scale: .55, opacity: .8, duration: .5, ease: 'power3.inOut' }, tLogo - .35);

  // marca: símbolo + wordmark com máscara e brilho varrendo
  const logo = el('div', 'abs', `
    <svg width="230" height="230" viewBox="0 0 230 230" style="display:block;margin:0 auto 40px">
      <defs><linearGradient id="lgc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#A66BFF"/><stop offset="1" stop-color="#7B2CFF"/></linearGradient></defs>
      <rect x="8" y="8" width="214" height="214" rx="56" fill="url(#lgc)"/>
      <path id="lg-path" d="M140 70 H100 A45 45 0 0 0 100 160 H140" fill="none" stroke="#fff" stroke-width="22" stroke-linecap="round"/>
      <circle cx="160" cy="115" r="13" fill="#22E58B"/>
    </svg>
    <div class="mask" style="position:relative;display:inline-block"><span id="wm" style="font-family:Grotesk;font-weight:700;font-size:170px;letter-spacing:.06em;color:#fff">CODRIAN</span>
      <i id="sweep" style="position:absolute;top:0;bottom:0;width:180px;left:-200px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent);mix-blend-mode:overlay;transform:skewX(-20deg)"></i></div>
    <div class="mono" style="font-size:32px;letter-spacing:.18em;color:var(--verde);margin-top:24px">LANDING PAGES QUE NÃO DEIXAM<br>CLIENTE ESCAPAR</div>`, mid);
  Object.assign(logo.style, { left: 0, right: 0, top: '720px', textAlign: 'center' });
  const sym = logo.querySelector('svg');
  TL.from(sym, { scale: 0, rotation: -120, duration: .6, ease: 'back.out(1.8)' }, tLogo - .15);
  TL.from(logo.querySelector('#lg-path'), { attr: { 'stroke-dasharray': '0 400' }, duration: .5, ease: 'power2.out' }, tLogo);
  TL.from(logo.querySelector('#wm'), { yPercent: 105, duration: .6, ease: 'expo.out' }, tLogo + .05);
  TL.to(logo.querySelector('#sweep'), { left: '1100px', duration: .9, ease: 'power2.inOut' }, tLogo + .5);
  TL.from(logo.querySelector('.mono'), { opacity: 0, y: 20, duration: .5 }, tLogo + .45);
  fx.flash(tLogo, '#7B2CFF', .5, .45);
  FX.burst(tLogo + .05, 540, 830, '166,107,255', 100, 1);
})();
