// CENA 8 (29.0 → 32.2s) — A arma: saco de evidência com um celular brilhando; revelação "LANDING PAGE".
(() => {
  const { TL, el, scene, fx, wt } = K;
  const S = scene('s-arma', 29.0, 32.2, { push: .1 });
  const tLP = wt('arma', 'Landing');

  const back = S.layer('', 20);
  el('div', 'abs', null, back).style.cssText = 'inset:0;background:#05030b';
  // raios de luz (cone girando)
  const rays = el('div', 'abs', null, back);
  rays.style.cssText = 'left:-500px;top:-150px;width:2080px;height:2080px;background:repeating-conic-gradient(from 0deg at 50% 50%, rgba(123,44,255,.22) 0 6deg, transparent 6deg 18deg);-webkit-mask:radial-gradient(circle, #000 0%, transparent 60%);mask:radial-gradient(circle, #000 0%, transparent 60%)';
  TL.fromTo(rays, { opacity: 0, rotation: 0 }, { opacity: 1, rotation: 25, duration: 3.2, ease: 'none' }, 29.0);

  const label = el('div', 'abs mono', 'EVIDÊNCIA Nº 01 · A ARMA DO CONCORRENTE', S.layer('', 30));
  Object.assign(label.style, { left: 0, right: 0, top: '250px', textAlign: 'center', fontSize: '30px', letterSpacing: '.16em', color: 'var(--roxo-2)' });
  TL.from(label, { clipPath: 'inset(0 50% 0 50%)', duration: .5, ease: 'power3.out' }, 29.1);

  const mid = S.layer('', 50);
  // celular brilhando
  const ph = el('div', 'phone', '<div class="notch"></div><div class="screen" style="background:radial-gradient(80% 60% at 50% 30%, #8a4dff, #2a0f66 60%, #0c0718)"></div>', mid);
  Object.assign(ph.style, { left: '220px', top: '360px', transform: 'scale(.82) rotate(-6deg)' });
  // saco plástico de evidência (2D)
  const bag = el('div', 'abs', `<div style="position:absolute;left:0;right:0;top:0;height:46px;background:rgba(255,61,110,.85);border-radius:16px 16px 0 0"></div>
     <div class="mono" style="position:absolute;left:40px;top:80px;background:#fff;color:#111;padding:18px 26px;font-size:28px;font-weight:700;transform:rotate(-3deg)">EVIDÊNCIA #01</div>`, mid);
  bag.style.cssText = 'left:140px;top:300px;width:800px;height:1180px;border-radius:30px;background:linear-gradient(115deg, rgba(255,255,255,.18), rgba(255,255,255,.04) 30%, rgba(255,255,255,.12) 55%, rgba(255,255,255,.03));border:3px solid rgba(255,255,255,.25);box-shadow:inset 0 0 80px rgba(255,255,255,.08)';
  TL.from([ph, bag], { y: 300, opacity: 0, duration: .7, ease: 'expo.out' }, 29.05);
  // brilho pulsando
  TL.fromTo(ph, { boxShadow: '0 0 0 3px #2d2346, 0 0 60px rgba(123,44,255,.3)' }, { boxShadow: '0 0 0 3px #2d2346, 0 0 260px rgba(123,44,255,.95)', duration: tLP - 29.3, ease: 'power2.in' }, 29.3);

  // revelação: saco rasga em duas metades
  TL.to(bag, { clipPath: 'polygon(0 0, 48% 0, 40% 100%, 0 100%)', x: -500, rotation: -12, opacity: 0, duration: .5, ease: 'power3.in' }, tLP - .05);
  const bag2 = bag.cloneNode(true); mid.appendChild(bag2);
  gsap.set(bag2, { opacity: 0 });
  TL.set(bag2, { opacity: 1, clipPath: 'polygon(48% 0, 100% 0, 100% 100%, 40% 100%)' }, tLP - .05)
    .to(bag2, { x: 500, rotation: 12, opacity: 0, duration: .5, ease: 'power3.in' }, tLP - .05);
  TL.to(ph, { scale: 1.02, rotation: 0, duration: .5, ease: 'back.out(1.6)' }, tLP);
  fx.flash(tLP, '#A66BFF', .6, .85);
  FX.burst(tLP, 540, 1000, '166,107,255', 120, 1.2);
  FX.burst(tLP + .05, 540, 1000, '34,229,139', 70, .9);

  const big = el('div', 'abs display', '<span class="grad-verde glow-verde">Landing</span><br><span style="color:#fff">Page.</span>', S.layer('', -40));
  Object.assign(big.style, { left: 0, right: 0, top: '1000px', textAlign: 'center', fontSize: '250px', lineHeight: '.88' });
  TL.from(big, { scale: 2.2, opacity: 0, filter: 'blur(20px)', duration: .35, ease: 'power4.out' }, tLP + .02);
  fx.shake(S.shk, tLP + .05, 30, .45);
})();
