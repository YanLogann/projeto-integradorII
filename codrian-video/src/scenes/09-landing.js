// CENA 9 (32.2 → 37.4s) — A Landing Page como protagonista: carrega em 1s, mostra prova, leva pro WhatsApp.
(() => {
  const { TL, el, scene, fx, wt } = K;
  const S = scene('s-lp', 32.2, 37.4, { push: .05 });
  const tAbre = wt('lp', 'Abre'), tProva = wt('lp', 'Mostra'), tWa = wt('lp', 'WhatsApp');

  const back = S.layer('', 40);
  el('div', 'abs', null, back).style.cssText = 'inset:0;background:radial-gradient(70% 45% at 50% 42%, rgba(123,44,255,.45), rgba(26,11,59,.6) 45%, #05030b 80%)';
  const ring = el('div', 'abs', null, back);
  ring.style.cssText = 'left:90px;top:300px;width:900px;height:900px;border-radius:50%;border:2px solid rgba(166,107,255,.35);box-shadow:0 0 120px rgba(123,44,255,.4), inset 0 0 120px rgba(123,44,255,.25)';
  TL.fromTo(ring, { scale: .6, opacity: 0 }, { scale: 1.3, opacity: 1, duration: 5, ease: 'power1.out' }, 32.2);

  const mid = S.layer('', 20);
  const ph = el('div', 'phone', '<div class="notch"></div><div class="screen" style="background:#0c0718"></div>', mid);
  Object.assign(ph.style, { left: '220px', top: '250px', boxShadow: '0 0 0 3px #3b2b66, 0 0 0 10px #0d0a16, 0 60px 140px rgba(0,0,0,.8), 0 0 200px rgba(123,44,255,.55)' });
  const scr = ph.querySelector('.screen');

  // conteúdo da LP (rola dentro do celular)
  const lp = el('div', 'lp', `
    <div class="lp-hero">
      <div class="lp-nav"><span>MARCOS<span style="color:var(--verde)">.</span>REFORMAS</span><i></i></div>
      <div class="lp-h1">Seu banheiro novo em <em>7 dias.</em></div>
      <div class="lp-sub">12 anos de obra entregue no prazo. Orçamento sem compromisso.</div>
      <div class="lp-btn">● Pedir orçamento no WhatsApp</div>
    </div>
    <div class="lp-sec">
      <h3>Quem contratou, recomenda</h3>
      <div class="lp-rev"><b>★★★★★</b>"Prazo cumprido, obra limpa. Recomendo de olhos fechados." <span style="opacity:.6">— Ana P.</span></div>
      <div class="lp-rev"><b>★★★★★</b>"Mandei mensagem às 22h e no dia seguinte já tinha orçamento." <span style="opacity:.6">— Rafael M.</span></div>
      <div class="lp-ba"><div style="background:linear-gradient(135deg,#5a5368,#2f2a3a)">ANTES</div><div style="background:linear-gradient(135deg,#7B2CFF,#22E58B)">DEPOIS</div></div>
    </div>
    <div class="lp-sec" style="text-align:center;padding-bottom:200px">
      <h3>Pronto para começar?</h3>
      <div class="lp-btn" id="wa-btn" style="font-size:36px;padding:34px 46px">● Chamar no WhatsApp</div>
    </div>`, scr);

  // carregamento: barra + skeleton → conteúdo
  const bar = el('div', 'abs', null, scr);
  bar.style.cssText = 'left:0;top:0;height:10px;width:100%;background:var(--verde);box-shadow:0 0 20px var(--verde);transform-origin:0 50%;z-index:6';
  TL.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: .9, ease: 'power2.inOut' }, tAbre);
  TL.to(bar, { opacity: 0, duration: .2 }, tAbre + .95);
  // skeleton enquanto carrega
  const sk = el('div', 'abs', '<div style="height:40px;width:50%;background:#241a3d;border-radius:12px;margin:130px 48px 80px"></div>' + '<div style="height:70px;background:#241a3d;border-radius:14px;margin:20px 48px"></div>'.repeat(3) + '<div style="height:90px;width:60%;background:#1f5c40;border-radius:50px;margin:50px 48px"></div>', scr);
  sk.style.cssText = 'inset:0';
  TL.fromTo(sk, { opacity: .5 }, { opacity: 1, duration: .2, repeat: 3, yoyo: true }, tAbre);
  TL.to(sk, { opacity: 0, duration: .15 }, tAbre + .75);
  TL.from(lp, { opacity: 0, duration: .25 }, tAbre + .7);
  TL.from(lp.querySelectorAll('.lp-hero > *'), { y: 50, opacity: 0, stagger: .07, duration: .45, ease: 'expo.out' }, tAbre + .75);

  // chips flutuantes (parallax frontal)
  const front = S.layer('', -90);
  const chip1 = el('div', 'chip verde', '<small>CARREGOU EM</small>⚡ 0,9 segundo', front);
  Object.assign(chip1.style, { left: '40px', top: '420px' });
  TL.from(chip1, { x: -400, opacity: 0, duration: .6, ease: 'expo.out' }, tAbre + .9);

  // scroll até as provas
  TL.to(lp, { y: -760, duration: .7, ease: 'power3.inOut' }, tProva - .1);
  const chip2 = el('div', 'chip', '<small>PROVA SOCIAL</small><span style="color:#ffd34d">★★★★★</span> 4,9 · 312 avaliações', front);
  Object.assign(chip2.style, { right: '30px', top: '880px' });
  TL.from(chip2, { x: 400, opacity: 0, duration: .6, ease: 'expo.out' }, tProva + .2);
  TL.to(chip1, { y: -60, opacity: .5, duration: .5 }, tProva + .2);

  // scroll até o CTA + toque
  TL.to(lp, { y: -1380, duration: .7, ease: 'power3.inOut' }, wt('lp', 'leva') - .1);
  TL.to([chip1, chip2], { opacity: 0, y: -40, duration: .3 }, wt('lp', 'leva'));
  const btn = lp.querySelector('#wa-btn');
  TL.to(btn, { scale: 1.08, repeat: 3, yoyo: true, duration: .18 }, wt('lp', 'direto'));
  const tap = el('div', 'abs', null, scr);
  tap.style.cssText = 'width:140px;height:140px;border-radius:50%;background:rgba(34,229,139,.35);border:5px solid var(--verde);left:240px;top:800px;opacity:0;z-index:7';
  TL.fromTo(tap, { scale: .3, opacity: 1 }, { immediateRender: false, scale: 2, opacity: 0, duration: .55 }, tWa + .05);
  TL.to(btn, { scale: .92, duration: .08, yoyo: true, repeat: 1 }, tWa + .05);
  FX.burst(tWa + .1, 540, 1080, '34,229,139', 90, .9);

  // mensagem chegando
  const msg = el('div', 'chip verde', '<small>WHATSAPP · AGORA</small>Novo pedido de orçamento ✓✓', front);
  Object.assign(msg.style, { left: '90px', top: '1230px' });
  TL.from(msg, { y: 120, scale: .7, opacity: 0, duration: .5, ease: 'back.out(1.8)' }, tWa + .3);

  // saída: tudo acelera para o centro
  TL.to(S.cam, { scale: 1.5, opacity: 0, filter: 'blur(12px)', duration: .35, ease: 'power3.in' }, 37.1);
})();
