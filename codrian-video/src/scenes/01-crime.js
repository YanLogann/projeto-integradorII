// CENA 1 (0 → 4.6s) — Cena do crime: chuva, sirenes roxo/verde, fita, título cinético.
(() => {
  const { TL, el, scene, fx, wt } = K;
  const S = scene('s-crime', 0, 4.6, { push: .1 });

  // sirenes alternando (luz simulada em 2D)
  const back = S.layer('', 40);
  const sA = el('div', 'siren', null, back); Object.assign(sA.style, { left: '-700px', top: '-300px', background: 'radial-gradient(circle, rgba(123,44,255,.9), transparent 65%)' });
  const sB = el('div', 'siren', null, back); Object.assign(sB.style, { right: '-700px', top: '-200px', background: 'radial-gradient(circle, rgba(34,229,139,.75), transparent 65%)' });
  TL.fromTo(sA, { opacity: .15 }, { opacity: 1, duration: .32, repeat: 13, yoyo: true, ease: 'sine.inOut' }, 0);
  TL.fromTo(sB, { opacity: 1 }, { opacity: .1, duration: .32, repeat: 13, yoyo: true, ease: 'sine.inOut' }, 0);

  // chão molhado: reflexo
  const floor = el('div', 'abs', null, back);
  Object.assign(floor.style, { left: 0, right: 0, bottom: 0, height: '700px', background: 'linear-gradient(180deg, transparent, rgba(123,44,255,.18) 40%, rgba(5,3,12,.9))' });

  // fitas
  const mid = S.layer('', 120);
  const tapeTxt = '<span>CENA DO CRIME</span><span>NÃO ULTRAPASSE</span>'.repeat(4);
  const t1 = el('div', 'tape', tapeTxt, mid); Object.assign(t1.style, { top: '330px', transform: 'rotate(-11deg)' });
  const t2 = el('div', 'tape', tapeTxt, mid); Object.assign(t2.style, { top: '1180px', transform: 'rotate(8deg)' });
  TL.fromTo(t1, { xPercent: -85 }, { xPercent: -12, duration: 1.0, ease: 'expo.out' }, 0.25)
    .to(t1, { xPercent: -4, duration: 3.4, ease: 'none' }, 1.25);
  TL.fromTo(t2, { xPercent: 40 }, { xPercent: -14, duration: 1.0, ease: 'expo.out' }, 0.55)
    .to(t2, { xPercent: -22, duration: 3.1, ease: 'none' }, 1.55);

  // título
  const front = S.layer('', -30);
  const title = el('div', 'abs display', `
    <span class="mask"><span style="font-size:150px;color:#fff">O cliente</span></span>
    <span class="mask"><span style="font-size:150px;color:#fff">foi</span></span>
    <span class="mask"><span class="grad-roxo glow-roxo" style="font-size:250px">roubado.</span></span>`, front);
  Object.assign(title.style, { left: '80px', top: '620px' });
  const lines = title.querySelectorAll('.mask > span');
  TL.from(lines, { yPercent: 110, duration: .8, ease: 'expo.out', stagger: .16 }, 0.3);
  const rob = lines[2];
  // aberração cromática no "roubado"
  TL.to(rob, { x: 10, textShadow: '-12px 0 rgba(34,229,139,.8), 12px 0 rgba(255,61,110,.7)', duration: .05, repeat: 5, yoyo: true }, 1.05);
  fx.shake(title, 0.75, 14, .35);

  const tag = el('div', 'abs mono', 'OCORRÊNCIA Nº 047 · 21:47', front);
  Object.assign(tag.style, { left: '86px', top: '560px', fontSize: '32px', letterSpacing: '.2em', color: 'var(--verde)' });
  TL.from(tag, { clipPath: 'inset(0 100% 0 0)', duration: .9, ease: 'steps(24)' }, 0.9);

  // saída: zoom pelo título
  TL.to(title, { scale: 1.7, opacity: 0, filter: 'blur(14px)', duration: .45, ease: 'power3.in', transformOrigin: '40% 60%' }, 4.15);
  TL.to(tag, { opacity: 0, duration: .2 }, 4.15);
  fx.flash(0.3, '#7B2CFF', .5, .5);
})();
