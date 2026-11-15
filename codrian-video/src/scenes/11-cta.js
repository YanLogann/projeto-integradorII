// CENA 11 (40.4 → 45s) — CTA: perfil CODRIAN, botão "Seguir" vira "Seguindo", frase final.
(() => {
  const { TL, el, scene, fx, wt } = K;
  const S = scene('s-cta', 40.4, 45.01, { push: .05 });
  const tSiga = wt('cta', 'Siga'), tAntes = wt('cta', 'antes');

  const back = S.layer('', 40);
  el('div', 'abs', null, back).style.cssText = 'inset:0;background:radial-gradient(70% 40% at 50% 38%, rgba(123,44,255,.42), transparent 70%), #05030b';

  const mid = S.layer('', 20);
  const card = el('div', 'abs', `
    <div style="display:flex;align-items:center;gap:40px">
      <div style="width:210px;height:210px;border-radius:50%;padding:7px;background:conic-gradient(#7B2CFF,#22E58B,#7B2CFF)">
        <div style="width:100%;height:100%;border-radius:50%;background:#0c0718;display:flex;align-items:center;justify-content:center">
          <svg width="120" height="120" viewBox="0 0 230 230"><path d="M140 70 H100 A45 45 0 0 0 100 160 H140" fill="none" stroke="#fff" stroke-width="24" stroke-linecap="round"/><circle cx="160" cy="115" r="14" fill="#22E58B"/></svg></div></div>
      <div><div style="font-size:64px;font-weight:700">@codrian</div><div class="mono" style="font-size:28px;color:rgba(255,255,255,.6);margin-top:8px;letter-spacing:.06em">Landing Pages que vendem</div></div>
    </div>
    <div id="follow" style="margin-top:50px;height:120px;border-radius:30px;background:var(--roxo);display:flex;align-items:center;justify-content:center;font-size:52px;font-weight:700;box-shadow:0 0 60px rgba(123,44,255,.6);position:relative;overflow:hidden">
      <span id="f1">Seguir</span><span id="f2" style="position:absolute;color:#04140b">Seguindo ✓</span></div>`, mid);
  Object.assign(card.style, { left: '90px', right: '90px', top: '420px', padding: '60px', borderRadius: '48px', background: 'rgba(18,11,34,.85)', border: '2px solid rgba(166,107,255,.4)', boxShadow: '0 50px 120px rgba(0,0,0,.6)' });
  TL.from(card, { y: 260, opacity: 0, scale: .9, duration: .7, ease: 'expo.out' }, 40.45);

  const follow = card.querySelector('#follow');
  gsap.set(card.querySelector('#f2'), { yPercent: 160 });
  const tTap = tSiga + .9;
  const tap = el('div', 'abs', null, mid);
  tap.style.cssText = 'width:160px;height:160px;border-radius:50%;border:6px solid #fff;left:460px;top:880px;opacity:0';
  TL.fromTo(tap, { scale: .3, opacity: 1 }, { immediateRender: false, scale: 1.8, opacity: 0, duration: .5 }, tTap);
  TL.to(follow, { scale: .95, duration: .08, yoyo: true, repeat: 1 }, tTap)
    .to(follow, { backgroundColor: '#22E58B', boxShadow: '0 0 80px rgba(34,229,139,.7)', duration: .25 }, tTap + .08)
    .to(card.querySelector('#f1'), { yPercent: -160, duration: .3, ease: 'power3.in' }, tTap + .08)
    .to(card.querySelector('#f2'), { yPercent: 0, duration: .35, ease: 'back.out(2)' }, tTap + .2);
  FX.burst(tTap + .1, 540, 940, '34,229,139', 80, .8);

  // frase final
  const line = el('div', 'abs display', '<span class="mask"><span>Antes que</span></span><span class="mask"><span>o próximo</span></span><span class="mask"><span class="grad-verde glow-verde">seja o seu.</span></span>', S.layer('', -40));
  Object.assign(line.style, { left: '90px', top: '1020px', fontSize: '128px' });
  TL.from(line, { opacity: 0, duration: .01 }, tAntes - .06);
  TL.from(line.querySelectorAll('.mask > span'), { yPercent: 110, duration: .55, ease: 'expo.out', stagger: .22 }, tAntes - .05);
})();
