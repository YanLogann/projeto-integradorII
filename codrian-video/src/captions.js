// Legendas integradas, sincronizadas palavra a palavra com os timestamps do ElevenLabs.
(() => {
  const { TL, el } = K;
  const box = document.getElementById('captions');
  // trechos em que a tipografia da cena já "é" a fala — legenda escondida para não duplicar
  const HIDE = [[21.2, 24.0], [38.7, 40.4], [42.0, 45]];
  const HIT = /^(roubado|marcos|sumiu|saiu|concorrente|entregue|landing|page|segundo|prova|whatsapp|codrian|seu)/i;

  for (const c of window.CAPTIONS) {
    if (HIDE.some(([a, b]) => c.s >= a && c.s < b)) continue;
    const cap = el('div', 'cap', null, box);
    if (c.voz === 'vitima') el('span', 'who', 'MARCOS · VÍTIMA', cap);
    const spans = c.words.map(w => el('span', 'w', w.w, cap));
    TL.fromTo(cap, { opacity: 0, y: 24, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .14, ease: 'power2.out' }, c.s - .06);
    c.words.forEach((w, i) => {
      TL.set(spans[i], { className: 'w on' + (HIT.test(w.w) ? ' hit' : '') }, w.s);
      if (HIT.test(w.w)) TL.fromTo(spans[i], { scale: 1.18 }, { scale: 1, duration: .25, ease: 'back.out(3)', immediateRender: false }, w.s);
    });
    TL.to(cap, { opacity: 0, duration: .1 }, c.out - .1);
  }
})();
