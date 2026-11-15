// CENA 4 (11.0 → 17.2s) — Pista em câmera de segurança: busca, perfil sem site, 4 segundos, saiu.
(() => {
  const { TL, el, scene, fx, wt } = K;
  const S = scene('s-pista', 11.0, 17.2, { push: .12 });
  const t0 = 11.0;

  const back = S.layer('', 30);
  el('div', 'abs', null, back).style.cssText = 'inset:0;background:radial-gradient(60% 45% at 50% 45%, rgba(123,44,255,.28), transparent 70%), #05030b';
  // scanlines CCTV
  const scan = el('div', 'abs', null, S.root);
  scan.style.cssText = 'inset:0;z-index:5;pointer-events:none;background:repeating-linear-gradient(180deg, rgba(255,255,255,.04) 0 2px, transparent 2px 6px);mix-blend-mode:overlay';
  const cam = el('div', 'abs mono', '<span class="rec-dot"></span>CAM 03 · EVIDÊNCIA DIGITAL', S.root);
  Object.assign(cam.style, { left: '80px', top: '230px', fontSize: '30px', letterSpacing: '.16em', zIndex: 6 });

  // celular
  const mid = S.layer('', 60);
  const ph = el('div', 'phone', '<div class="notch"></div><div class="screen"></div>', mid);
  Object.assign(ph.style, { left: '220px', top: '330px', transform: 'rotate(-3deg)' });
  const scr = ph.querySelector('.screen');
  TL.from(ph, { y: 500, rotation: 8, opacity: 0, duration: .7, ease: 'expo.out' }, t0);

  // tela 1: busca
  const s1 = el('div', 'abs', `
    <div style="padding:120px 40px 0">
      <div style="font-weight:700;font-size:44px;letter-spacing:-.02em;margin-bottom:30px;color:#333">Buscar</div>
      <div style="border-radius:50px;border:2px solid #ddd;padding:24px 30px;font-size:30px;color:#222;box-shadow:0 6px 20px rgba(0,0,0,.08)"><span id="q"></span><span style="color:var(--roxo)">|</span></div>
      <div id="res" style="margin-top:40px"></div>
    </div>`, scr);
  s1.style.cssText = 'inset:0;background:#fff';
  const q = s1.querySelector('#q');
  const query = 'reforma de banheiro perto de mim';
  for (let i = 0; i <= query.length; i++) TL.set(q, { textContent: query.slice(0, i) }, t0 + .25 + i * .03);
  const res = s1.querySelector('#res');
  const results = [
    ['Concorrente Reformas', 'concorrentereformas.com.br', 'Orçamento em 30s pelo WhatsApp · ★ 4,9'],
    ['Marcos Reformas', 'instagram · @marcosreformas', 'Orçamento pelo direct'],
    ['Reforma Já', 'reformaja.com.br', 'Atendimento 24h'],
  ];
  const resEls = results.map(([t, u, d], i) => {
    const r = el('div', '', `<div style="font-size:22px;color:#2a7">${u}</div><div style="font-size:34px;color:#3a1ccf;font-weight:700;margin:6px 0">${t}</div><div style="font-size:24px;color:#555">${d}</div>`, res);
    r.style.cssText = 'padding:26px 22px;border-radius:24px;margin-bottom:12px';
    TL.from(r, { opacity: 0, y: 30, duration: .3 }, t0 + 1.3 + i * .12);
    return r;
  });
  const tAchou = wt('pista', 'Achou');
  TL.to(resEls[1], { background: 'rgba(123,44,255,.12)', boxShadow: '0 0 0 4px #7B2CFF', duration: .2 }, tAchou);
  // dedo/toque
  const tap = el('div', 'abs', null, scr);
  tap.style.cssText = 'width:110px;height:110px;border-radius:50%;border:6px solid #7B2CFF;left:300px;top:560px;opacity:0';
  TL.fromTo(tap, { scale: .4, opacity: 1 }, { immediateRender: false, scale: 1.6, opacity: 0, duration: .5 }, tAchou + .45);

  // tela 2: perfil sem site
  const s2 = el('div', 'abs', `
    <div style="padding:110px 36px 0">
      <div style="display:flex;align-items:center;gap:28px">
        <div style="width:140px;height:140px;border-radius:50%;background:linear-gradient(135deg,#c9c3d6,#8d86a0)"></div>
        <div><div style="font-weight:700;font-size:36px">marcosreformas</div><div style="font-size:24px;color:#666;margin-top:6px">Reformas em geral · orçamento pelo direct</div></div>
      </div>
      <div style="margin-top:26px;font-size:24px;color:#999">🔗 nenhum link</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:34px">${'<div style="aspect-ratio:1;background:#d9d5e2"></div>'.repeat(12)}</div>
    </div>`, scr);
  s2.style.cssText = 'inset:0;background:#fff';
  TL.fromTo(s2, { xPercent: 100 }, { xPercent: 0, duration: .35, ease: 'power3.out' }, tAchou + .6);

  // cronômetro 4 segundos
  const tQ = wt('pista', 'Quatro');
  const front = S.layer('', -40);
  const clock = el('div', 'abs', `
    <svg width="380" height="380" viewBox="0 0 380 380"><circle cx="190" cy="190" r="170" fill="rgba(10,5,20,.85)" stroke="rgba(255,255,255,.12)" stroke-width="14"/>
    <circle id="arc" cx="190" cy="190" r="170" fill="none" stroke="#FF3D6E" stroke-width="14" stroke-linecap="round" transform="rotate(-90 190 190)" stroke-dasharray="1068" stroke-dashoffset="1068"/></svg>
    <div class="display" id="sec" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:170px;color:#fff">0s</div>`, front);
  Object.assign(clock.style, { left: '600px', top: '1000px', width: '380px', height: '380px' });
  TL.from(clock, { scale: 0, rotation: -90, duration: .45, ease: 'back.out(1.7)' }, tQ - .1);
  const tSaiu = wt('pista', 'saiu');
  TL.to(clock.querySelector('#arc'), { attr: { 'stroke-dashoffset': 0 }, duration: tSaiu - tQ, ease: 'none' }, tQ);
  const sec = clock.querySelector('#sec');
  for (let i = 0; i <= 4; i++) TL.set(sec, { textContent: i + 's' }, tQ + i * (tSaiu - tQ) / 4);

  // saiu: tela sai, glitch, carimbo
  TL.to(s2, { xPercent: -100, duration: .25, ease: 'power3.in' }, tSaiu - .05);
  fx.glitch(tSaiu, .3);
  const out = el('div', 'abs stamp', 'SAIU', front);
  Object.assign(out.style, { left: '150px', top: '760px', fontSize: '200px', transform: 'rotate(-10deg)', mixBlendMode: 'normal', background: 'rgba(10,5,20,.6)' });
  TL.from(out, { scale: 3, opacity: 0, duration: .16, ease: 'power4.in' }, tSaiu + .08);
  fx.shake(S.shk, tSaiu + .24, 26, .35);
})();
