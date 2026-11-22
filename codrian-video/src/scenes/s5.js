// CENA 05 — A EMPRESA GANHA VIDA (23.2–29.4s)
(function (CD) {
  const C = CD.C, E = CD.ease;
  CD.scene.s5 = (t, rt) => {
    const K = CD.K;
    const zoomLP = E.inOut(CD.prog(t, 26.5, 27.3));
    CD.setCam(CD.lerp(540, 520, zoomLP), CD.lerp(960, 900, zoomLP), CD.tw(t, 23.2, 26.5, 1.0, 1.05) + 0.05 * zoomLP, 0);
    const lit = E.out(CD.prog(t, 23.3, 24.2));
    const hand = [-40, -250];
    const phoneW = 150, phoneH = 290;
    const owner = {
      mood: 'happy', blink: CD.step % 31 === 0, look: t < 25.9 ? [-10, 10] : [14, 2],
      phoneArm: hand,
      drawInHand: (h) => { if (t < 23.85) return; CD.smartphone(h[0] + 10, h[1] - 120, phoneW, phoneH, -0.08, (w, hh) => CD.drawLP(w / 2, hh / 2, w / 860 * 0.98), { sh: 0.8 }); },
    };
    // clientes chegando em primeiro plano + na porta
    const door = () => { if (t > 25.2) { const a = E.out(CD.prog(t, 25.2, 25.7)); CD.person(CD.lerp(1060, 880, a), 1390, 1.55, { col: '#4f8f6f', face: -1, front: a >= 1, walk: a < 1 ? CD.ta * 14 : null, seed: 70 }); } };
    const front = () => CD.layer(1.12, () => {
      [[23.9, 860, '#c57b4b', '#1d140f'], [24.6, 1060, '#a0607e', '#5a3a22']].forEach(([t0, xs, col, hair], i) => {
        if (t < t0) return; const k = E.out(CD.prog(t, t0, t0 + 0.9));
        CD.person(CD.lerp(1350, xs, k), 2010, 2.3, { col, hair, face: -1, walk: k < 1 ? CD.ta * 12 + i : null, seed: 80 + i * 9 });
      });
    });
    CD.fill(C.bg0);
    CD.drawShop(t, { lit, owner, door, front, handset: { x: 250, y: 1098, rot: 0 } });
    // iluminação: quente + roxo lateral
    const c = CD.toScreen(520, 820, 0.92);
    CD.dark(c[0], c[1], 1300, 0.55 - 0.25 * lit);
    CD.glow(1080, 700, 900, 'rgba(123,63,228,1)', 0.25 * lit);
    // LP voando da tela cheia para o celular do empresário
    if (t < 23.9) {
      const k = E.inOut(CD.prog(t, 23.2, 23.85));
      const tgt = CD.toScreen(520 + hand[0] + 10, 1190 + hand[1] - 120, 0.92);
      CD.screen(); CD.drawLP(CD.lerp(540, tgt[0], k), CD.lerp(860, tgt[1], k), CD.lerp(1, phoneW / 860 * CD.cam.z, k));
    }
    // notificações
    CD.screen();
    [['Nova mensagem', 24.3], ['Novo contato', 25.0], ['Pedido de orçamento', 25.7]].forEach(([s, t0], i) => {
      if (t < t0) return; const p = CD.pop(t, t0, 0.3), a = 1 - zoomLP;
      CD.ctx.save(); CD.ctx.translate(245 + (i % 2) * 14, 470 + i * 125); CD.ctx.rotate(CD.rs(i, 81) * 0.05); CD.ctx.scale(p, p); CD.ctx.globalAlpha *= a;
      CD.cut(CD.R(-215, -46, 430, 92, 22), C.white, { seed: 600 + i, sh: 1.1 });
      CD.icon('chat', -168, 0, 28, C.greenD);
      CD.text(s, -125, 2, { size: 28, fam: 'Inter', weight: '800', color: C.ink, align: 'left', shadow: false });
      CD.ctx.restore();
    });
    // destaque: a LP de novo, grande
    if (zoomLP > 0) {
      CD.fill('#0b0712', 0.55 * zoomLP);
      CD.glow(540, 930, 800, 'rgba(123,63,228,1)', 0.6 * zoomLP);
      const fl = Math.sin(CD.ta * 2.4) * 8;
      CD.drawLP(540, CD.lerp(1300, 930, zoomLP) + fl, CD.lerp(0.2, 0.78, zoomLP));
      if (t > K.encontrada) CD.label('ENCONTRADA.', 540, 210, { size: 100, rot: -0.04, sc: CD.lerp(1.7, 1, E.back(CD.prog(t, K.encontrada, K.encontrada + 0.14))) });
      if (t > K.lembrada) CD.label('LEMBRADA.', 540, 345, { size: 100, rot: 0.03, bg: C.green, color: C.ink, sc: CD.lerp(1.7, 1, E.back(CD.prog(t, K.lembrada, K.lembrada + 0.14))) });
    }
  };
})(window.CD);
