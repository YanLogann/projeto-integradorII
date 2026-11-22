// CENA 02 — A CONCORRÊNCIA (4.5–9.8s). Transições laterais em camadas.
(function (CD) {
  const C = CD.C, E = CD.ease;
  const AX = 1940, BX = 3340; // centros dos sets A (celular) e B (rua)
  const lc = (d, cx) => cx * d + 540 * (1 - d); // centro da camada d quando a câmera está em cx

  const setA = (t) => {
    CD.layer(0.5, () => {
      const c = lc(0.5, AX);
      CD.cut(CD.R(c - 800, -200, 1600, 2400), '#1c1727', { sh: 0, amp: 0, seed: 300, grain: 0.4 });
      for (let i = 0; i < 9; i++) {
        const bx = c - 640 + i * 150, bh = 500 + CD.rnd(i, 3) * 500;
        CD.cut(CD.R(bx, 1500 - bh, 130, bh + 600), '#251e33', { seed: 301 + i, sh: 0.6 });
        for (let w = 0; w < 6; w++) if (CD.rnd(i, w) > 0.45) CD.cut(CD.R(bx + 22 + (w % 2) * 52, 1560 - bh + Math.floor(w / 2) * 90, 30, 40), CD.rnd(w, i) > 0.6 ? '#6c5a9e' : '#3a2f4f', { seed: 320 + i * 7 + w, sh: 0, amp: 1, grain: 0 });
      }
    });
    CD.layer(1, () => {
      // tela do celular
      const tp = (t - 5.1) / 0.8, query = 'serviço perto de mim', n = Math.round(CD.clamp(tp) * query.length);
      const res = CD.pop(t, 5.95, 0.3), tapT = 6.8, sel = t > tapT;
      CD.smartphone(AX, 880, 560, 1080, 0.035, (w, h) => {
        CD.cut(CD.R(0, 0, w, h), '#f4f1ea', { sh: 0, amp: 0, seed: 330 });
        CD.cut(CD.R(24, 40, w - 48, 74, 37), '#fff', { seed: 331, sh: 0.5 });
        CD.cut(CD.E(66, 77, 15, 15), C.purple, { seed: 332, sh: 0 });
        CD.text(query.slice(0, n) + (CD.step % 2 && t < 6 ? '|' : ''), 96, 79, { size: 27, fam: 'Inter', weight: '700', color: C.ink, align: 'left', shadow: false });
        if (res > 0.01) {
          const ctx = CD.ctx;
          // resultado 1: SUA EMPRESA (sem site)
          ctx.save(); ctx.translate(w / 2, 300); ctx.scale(res, res); ctx.translate(-w / 2, -300);
          CD.cut(CD.R(24, 160, w - 48, 270, 18), '#e2ddd5', { seed: 333, sh: 0.6 });
          CD.cut(CD.R(44, 180, 150, 150, 12), '#b9b3bf', { seed: 334, sh: 0 }); CD.text('?', 119, 258, { size: 90, color: '#8d8696', shadow: false });
          CD.text('SUA EMPRESA', 214, 214, { size: 38, color: '#6c6676', align: 'left', shadow: false });
          CD.text('Sem site', 214, 262, { size: 24, fam: 'Inter', weight: '700', color: '#8d8696', align: 'left', shadow: false });
          CD.text('Sem informações', 214, 296, { size: 24, fam: 'Inter', weight: '700', color: '#8d8696', align: 'left', shadow: false });
          ctx.restore();
          // resultado 2: CONCORRENTE (com landing page)
          ctx.save(); ctx.translate(w / 2, 600); const r2 = CD.pop(t, 6.15, 0.3); ctx.scale(r2, r2); ctx.translate(-w / 2, -600);
          CD.cut(CD.R(24, 460, w - 48, 380, 18), '#fff', { seed: 335, sh: sel ? 1.6 : 0.8 });
          if (sel) { CD.ctx.save(); CD.path(CD.ctx, CD.R(24, 460, w - 48, 380, 18)); CD.ctx.strokeStyle = C.purple; CD.ctx.lineWidth = 8; CD.ctx.stroke(); CD.ctx.restore(); }
          ctx.save(); CD.path(ctx, CD.R(44, 480, w - 88, 210, 12)); ctx.clip(); CD.drawLP(w / 2, 585 + 140, 0.5); ctx.restore();
          CD.text('CONCORRENTE', 44, 730, { size: 38, color: C.ink, align: 'left', shadow: false });
          CD.cut(CD.R(w - 214, 700, 170, 60, 30), C.green, { seed: 336, sh: 0.5 }); CD.text('VER SITE', w - 129, 731, { size: 22, fam: 'Inter', weight: '800', color: C.ink, shadow: false });
          CD.text('Site • Serviços • Contato', 44, 790, { size: 23, fam: 'Inter', weight: '700', color: C.purpleD, align: 'left', shadow: false });
          ctx.restore();
          if (t > tapT && t < tapT + 0.4) { const k = CD.prog(t, tapT, tapT + 0.4); CD.cut(CD.E(w - 129, 731, 30 + k * 90, 30 + k * 90), `rgba(123,63,228,${0.5 * (1 - k)})`, { sh: 0, grain: 0, edge: false, seed: 337 }); }
        }
      });
      // dedo que toca
      const fp = E.inOut(CD.prog(t, 6.3, 6.75)), back = E.inOut(CD.prog(t, 6.85, 7.05));
      const fx = CD.lerp(AX + 260, AX + 150, fp), fy = CD.lerp(1600, 1185, fp) + back * 200;
      CD.seg([fx + 130, fy + 500], [fx, fy], 82, C.skin, 340);
      CD.cut(CD.R(AX + 180, 1200, 120, 260, 50), C.skinD, { seed: 341, sh: 1 });
    });
    // ombro/cabeça da cliente em primeiro plano (over-the-shoulder)
    CD.layer(1.2, () => {
      const c = lc(1.2, AX);
      CD.cut(CD.E(c - 380, 1980, 360, 260), '#7a4f9e', { seed: 345, sh: 1.5 });
      CD.cut(CD.E(c - 400, 1620, 230, 250), '#3b2418', { seed: 346, sh: 1.5 });
    });
  };

  CD.streetB = (t, o = {}) => {
    const dim = CD.prog(t, 7.9, 8.6);
    CD.layer(0.4, () => {
      const c = lc(0.4, BX);
      CD.cut(CD.R(c - 800, -300, 1600, 2400), '#18122a', { sh: 0, amp: 0, seed: 360 });
      CD.cut(CD.E(c + 260, 330, 90, 90), '#e8e0c8', { seed: 361, sh: 0 }); CD.glow(c + 260, 330, 300, 'rgba(232,224,200,0.4)');
      for (let i = 0; i < 14; i++) CD.cut(CD.E(c - 500 + CD.rnd(i, 1) * 1000, 120 + CD.rnd(i, 2) * 500, 4, 4, 6), '#cfc6ef', { sh: 0, grain: 0, edge: false, seed: i });
    });
    CD.layer(0.65, () => {
      const c = lc(0.65, BX);
      for (let i = 0; i < 8; i++) { const h = 300 + CD.rnd(i, 7) * 350; CD.cut(CD.R(c - 700 + i * 180, 1250 - h, 170, h + 400), '#221a31', { seed: 370 + i, sh: 0.6 }); }
    });
    CD.layer(1, () => {
      CD.cut(CD.R(BX - 900, 1340, 1800, 800), '#2a2433', { sh: 0, amp: 0, seed: 380 });
      CD.cut(CD.R(BX - 900, 1330, 1800, 26), '#3d354a', { sh: 0.6, seed: 381 });
      // fachada A (sua empresa) — apagada
      const ax = BX - 300;
      CD.cut(CD.R(ax - 190, 780, 380, 570), '#4a4555', { seed: 382, sh: 1.2 });
      CD.cut(CD.R(ax - 170, 800, 340, 70), '#3a3644', { seed: 383, sh: 0.4 });
      CD.cut(CD.R(ax - 150, 920, 170, 170), '#2a2633', { seed: 384, sh: 0.3 });
      CD.ctx.save(); CD.path(CD.ctx, CD.R(ax - 150, 920, 170, 170)); CD.ctx.clip(); CD.owner(ax - 65, 1210, 0.33, { mood: 'sad' }); CD.ctx.restore();
      CD.cut(CD.R(ax + 50, 960, 110, 390), '#2d2936', { seed: 385, sh: 0.4 });
      if (dim > 0) CD.cut(CD.R(ax - 190, 780, 380, 570), `rgba(5,3,10,${0.45 * dim})`, { sh: 0, amp: 0, grain: 0, edge: false, seed: 386 });
      // fachada B (concorrente) — viva
      const bx = BX + 230;
      CD.cut(CD.R(bx - 190, 780, 380, 570), '#e9e0cf', { seed: 387, sh: 1.2 });
      for (let i = 0; i < 6; i++) CD.cut(CD.P([[bx - 200 + i * 67, 800], [bx - 133 + i * 67, 800], [bx - 133 + i * 67, 880], [bx - 166 + i * 67, 905], [bx - 200 + i * 67, 880]]), i % 2 ? C.white : C.purple, { seed: 388 + i, sh: 0.6 });
      CD.cut(CD.R(bx - 150, 950, 170, 160), '#ffe9b8', { seed: 395, sh: 0.3 }); CD.glow(bx - 65, 1030, 260, 'rgba(255,220,160,0.8)', 0.7);
      CD.cut(CD.R(bx + 50, 960, 110, 390), C.purpleD, { seed: 396, sh: 0.4 });
      CD.cut(CD.R(bx - 130, 1150, 150, 56, 6), C.green, { seed: 397, sh: 0.5 }); CD.text('ABERTO', bx - 55, 1179, { size: 32, color: C.ink, shadow: false });
      CD.glow(bx - 55, 1179, 180, 'rgba(47,214,123,0.8)', 0.6);
    });
    // mini landing page flutuando sobre o concorrente
    CD.layer(0.95, () => {
      const p = CD.pop(t, 7.65, 0.4); if (p <= 0.01) return;
      const fy = Math.sin(CD.ta * 3) * 10, bx = BX + 230;
      CD.glow(bx, 570, 380, 'rgba(123,63,228,0.9)', 0.8 * p);
      CD.stroke([[bx, 720], [bx, 790]], 'rgba(167,123,255,0.8)', 4, 398);
      CD.drawLP(bx, 570 + fy, 0.24 * p);
    });
    // clientes indo para o concorrente
    CD.layer(1, () => {
      for (let i = 0; i < 2; i++) {
        const t0 = 7.6 + i * 0.5, k = CD.prog(t, t0, t0 + 1.5); if (t < t0) continue;
        const x = CD.lerp(BX - 620, BX + 300, E.inOut(k)), a = 1 - CD.prog(t, t0 + 1.5, t0 + 1.8);
        if (a > 0) CD.person(x, 1380 + i * 30, 1.05, { col: i ? '#c57b4b' : '#6a7fae', hair: i ? '#1d140f' : '#5a3a22', walk: k < 1 ? CD.ta * 14 + i : null, alpha: a, seed: 20 + i * 9, phone: i === 0 });
      }
    });
    if (!o.noText) {
      CD.screen();
      const K = CD.K;
      const L = [['SEM SITE', 7.7, 650, BX - 270], ];
      // etiqueta "SEM SITE" sobre a fachada A (no mundo)
      CD.layer(1, () => { const p = CD.pop(t, 7.75, 0.3); if (p > 0.01) CD.label("SEM SITE", BX - 300, 700, { size: 58, sc: p, rot: -0.08, bg: '#b9b3bf', color: '#2f2b38' }); });
      CD.screen();
      if (t > K.facil) CD.label("MAIS FÁCIL", 540, 205, { size: 104, rot: -0.04, sc: CD.lerp(1.7, 1, E.back(CD.prog(t, K.facil, K.facil + 0.14))) });
      if (t > K.encontrar) CD.label("DE ENCONTRAR.", 540, 335, { size: 104, rot: 0.03, bg: C.purple, color: C.white, sc: CD.lerp(1.7, 1, E.back(CD.prog(t, K.encontrar, K.encontrar + 0.14))) });
    }
  };

  CD.scene.s2 = (t) => {
    let cx = CD.tw(t, 4.5, 5.1, 540, AX, E.inOut);
    cx = CD.tw(t, 7.0, 7.6, cx, BX, E.inOut);
    const z = t < 7.0 ? CD.tw(t, 5.1, 7.0, 1.0, 1.05, E.inOut) : CD.tw(t, 7.6, 9.8, 1.0, 1.06, E.inOut);
    CD.setCam(cx, 960, z, 0);
    CD.fill(C.bg0);
    if (cx < 1500) { CD.drawShop(t, { owner: { mood: 'sad' } }); }
    if (cx > 700 && cx < 3000) setA(t);
    if (cx > 2200) CD.streetB(t);
    if (t < 5.3) { const c = CD.toScreen(520, 820, 0.92); CD.dark(c[0], c[1], 980, 0.7 * (1 - CD.prog(t, 4.6, 5.1))); }
  };
})(window.CD);
