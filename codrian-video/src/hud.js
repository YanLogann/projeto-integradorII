// HUD investigativo persistente: cantos de câmera, REC, timecode, número do caso.
(() => {
  const { TL, el } = K;
  const hud = document.getElementById('hud');
  const corners = [['70px', '150px', '6px 0 0 6px'], ['auto', '150px', '6px 6px 0 0'], ['70px', 'auto', '0 0 6px 6px'], ['auto', 'auto', '0 6px 6px 0']];
  const cs = corners.map(([l, t, bw], i) => {
    const c = el('div', 'corner', null, hud);
    Object.assign(c.style, { left: l, top: t, right: l === 'auto' ? '70px' : 'auto', bottom: t === 'auto' ? '330px' : 'auto', borderWidth: bw });
    return c;
  });
  const rec = el('div', 'hud-item', '<span class="rec-dot"></span>REC', hud);
  Object.assign(rec.style, { right: '100px', top: '170px' });
  const tc = el('div', 'hud-item', '', hud);
  Object.assign(tc.style, { left: '100px', top: '170px' });
  // timecode de "câmera" (21:47:00 + t)
  for (let f = 0; f < 45 * 4; f++) {
    const t = f / 4, s = Math.floor(t), sec = (s % 60).toString().padStart(2, '0');
    TL.set(tc, { textContent: `21:47:${sec}:${String(Math.floor((t % 1) * 24)).padStart(2, '0')}` }, t);
  }
  TL.to(rec.querySelector('.rec-dot'), { opacity: .15, duration: .5, repeat: 44, yoyo: true, ease: 'steps(1)' }, 0);

  // HUD some na solução (a investigação acabou)
  TL.to([...cs, rec, tc], { opacity: 0, duration: .3 }, 29.0);
})();
