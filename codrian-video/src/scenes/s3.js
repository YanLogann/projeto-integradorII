// CENA 03 — O CEMITÉRIO DOS CLIENTES (9.8–14.5s)
(function (CD) {
  const C = CD.C, E = CD.ease, BX = 3340, HX = 3340, HY = 1470;
  const lc = (d, cx) => cx * d + 540 * (1 - d);
  const stones = [['SEM\nSITE', 'semSite', -300], ['SEM\nINFORMAÇÃO', 'semInfo', 0], ['SEM\nPRESENÇA\nDIGITAL', 'semPres', 300]];
  const cols = ['#6a7fae', '#c57b4b', '#4f8f6f', '#a0607e', '#7b6aa8'];

  CD.cemetery = (t, rise) => {
    const up = (d) => (1 - rise) * 1500 * d; // o cenário "sobe" do chão como teatro de papel
    CD.layer(0.4, () => {
      const c = lc(0.4, BX);
      CD.cut(CD.R(c - 900, -300, 1800, 2500), '#0f0b18', { sh: 0, amp: 0, seed: 400 });
      CD.glow(c + 200, 380, 700, 'rgba(90,50,160,0.5)', rise);
      CD.cut(CD.E(c + 200, 380 + up(0.3), 120, 120), '#d9d1bd', { seed: 401, sh: 0 });
      CD.cut(CD.E(c + 245, 360 + up(0.3), 110, 115), '#0f0b18', { seed: 402, sh: 0, edge: false });
    });
    CD.layer(0.6, () => {
      const c = lc(0.6, BX);
      CD.cut(CD.P([[c - 900, 1200], [c - 500, 1010], [c - 150, 1120], [c + 250, 980], [c + 700, 1100], [c + 900, 1060], [c + 900, 2200], [c - 900, 2200]]).map((p) => [p[0], p[1] + up(0.6)]), '#1a1426', { seed: 403, sh: 0.6 });
      // árvore morta
      const tx = c - 380, ty = 1180 + up(0.7);
      CD.cut(CD.P([[tx - 26, ty], [tx - 14, ty - 380], [tx - 120, ty - 520], [tx - 100, ty - 530], [tx, ty - 420], [tx + 20, ty - 600], [tx + 40, ty - 590], [tx + 26, ty - 400], [tx + 140, ty - 480], [tx + 150, ty - 465], [tx + 22, ty - 330], [tx + 30, ty]]), '#0b0810', { seed: 404, sh: 0.8 });
    });
    CD.layer(0.8, () => {
      const c = lc(0.8, BX);
      for (let i = 0; i < 16; i++) { const x = c - 800 + i * 100, r = CD.rs(i, 41) * 0.15; CD.ctx.save(); CD.ctx.translate(x, 1240 + up(0.8)); CD.ctx.rotate(r); CD.cut(CD.P([[-14, 0], [-14, -160], [0, -185], [14, -160], [14, 0]]), '#241c30', { seed: 405 + i, sh: 0.4 }); CD.ctx.restore(); }
      CD.cut(CD.R(c - 820, 1130 + up(0.8), 1640, 18), '#241c30', { seed: 430, sh: 0.4 });
    });
    CD.layer(1, () => {
      CD.cut(CD.P([[BX - 900, 1250], [BX - 300, 1225], [BX + 300, 1245], [BX + 900, 1230], [BX + 900, 2300], [BX - 900, 2300]]).map((p) => [p[0], p[1] + up(1)]), '#1e1828', { seed: 431, sh: 0.8 });
      for (let i = 0; i < 18; i++) { const gx = BX - 800 + CD.rnd(i, 51) * 1600, gy = 1290 + CD.rnd(i, 52) * 500 + up(1); CD.cut(CD.P([[gx - 14, gy], [gx - 6, gy - 30], [gx, gy - 8], [gx + 8, gy - 34], [gx + 14, gy]]), '#2a2238', { seed: 440 + i, sh: 0.2 }); }
      // lápides
      stones.forEach(([txt, key, dx], i) => {
        const p = CD.ease.back(CD.prog(t, CD.K[key], CD.K[key] + 0.35)); if (p <= 0) return;
        const x = BX + dx, y = 1290 + (1 - p) * 420 + up(1), w = i === 1 ? 270 : 230, h = i === 2 ? 380 : 320;
        CD.ctx.save(); CD.ctx.translate(x, y); CD.ctx.rotate(CD.rs(i, 61) * 0.06 + (1 - p) * 0.2);
        CD.cut(CD.P([[-w / 2, 0], [-w / 2, -h + w / 2], ...Array.from({ length: 9 }, (_, k) => { const a = Math.PI + k / 8 * Math.PI; return [Math.cos(a) * w / 2, -h + w / 2 + Math.sin(a) * w / 2]; }), [w / 2, 0]]), '#6a6478', { seed: 450 + i, sh: 1.2 });
        CD.cut(CD.R(-w / 2 + 14, -h + 30, w - 28, h - 44, 12), '#5a5468', { seed: 455 + i, sh: 0, edge: false, alpha: 0.7 });
        const lines = txt.split("\n"), fs = i === 1 ? 40 : 50;
        lines.forEach((l, k) => CD.text(l, 0, -h / 2 + (k - (lines.length - 1) / 2) * fs * 1.12 + 14, { size: fs, color: '#1d1a24', shadow: false }));
        CD.ctx.restore();
      });
      // o buraco
      const hr = rise;
      CD.cut(CD.E(HX, HY + up(1), 330 * hr + 1, 95 * hr + 1, 40), '#030205', { seed: 460, sh: 0, amp: 5 });
      CD.cut(CD.E(HX, HY + 14 + up(1), 300 * hr + 1, 72 * hr + 1, 40), '#000', { seed: 461, sh: 0, amp: 3, edge: false, grain: 0 });
      // clientes caminhando até o buraco e caindo
      CD.K.falls.forEach((tf, i) => {
        const ts = tf - 1.3; if (t < ts || rise < 1) return;
        const side = i % 2 ? 1 : -1, x0 = HX + side * 820, wk = E.lin(CD.prog(t, ts, tf));
        const x = CD.lerp(x0, HX + side * 40, wk), fall = CD.prog(t, tf, tf + 0.4);
        if (fall >= 1) return;
        const y = HY + 20 + E.in(fall) * 340;
        CD.ctx.save();
        if (fall > 0) { CD.ctx.beginPath(); CD.ctx.rect(HX - 2000, -3000, 4000, 3000 + HY + 10); CD.ctx.clip(); }
        CD.person(x, y, 1.0, { col: cols[i], face: -side, walk: fall > 0 ? null : CD.ta * 14 + i, seed: 30 + i * 7, front: fall > 0 });
        CD.ctx.restore();
        if (fall > 0 && fall < 0.8) CD.stroke([[x - 40, HY - 200], [x - 46, HY - 300]], 'rgba(255,255,255,0.5)', 5, i);
      });
    });
    // neblina
    CD.layer(0.9, () => {
      for (let i = 0; i < 3; i++) { const fx = BX - 900 + ((CD.ta * 40 * (i + 1) + i * 500) % 600); CD.cut(CD.R(fx, 1180 + i * 90, 1500, 60, 30), 'rgba(140,120,190,0.10)', { sh: 0, grain: 0, edge: false, seed: 470 + i, amp: 8 }); }
    });
    // empresário em primeiro plano, de costas/lado, olhando
    CD.layer(1.25, () => { const c = lc(1.25, BX); CD.owner(c - 400, 2200 + up(1.2), 1.1, { mood: 'sad', look: [8, 4] }); });
  };

  CD.scene.s3 = (t) => {
    // câmera segue o 4º cliente até a borda do buraco
    const f4 = CD.K.falls[3];
    const fol = E.inOut(CD.prog(t, 12.4, f4 + 0.2));
    const z = CD.lerp(1.06, 1.75, fol), cx = BX + CD.lerp(0, 40, fol), cy = CD.lerp(960, 1300, fol);
    CD.setCam(cx, cy, z, CD.lerp(0, -0.02, fol));
    CD.fill(C.bg0);
    const sink = E.in(CD.prog(t, 9.8, 10.3)), rise = E.out(CD.prog(t, 9.85, 10.45));
    if (sink < 1) { CD.ctx.save(); CD.ctx.translate(0, sink * 1400); CD.streetB(9.79, { noText: true }); CD.ctx.restore(); }
    if (rise > 0) CD.cemetery(t, rise);
    const c = CD.toScreen(HX, HY, 1);
    CD.dark(c[0], c[1] - 300, 1100, 0.6 + 0.25 * fol);
    CD.glow(c[0], c[1], 500, 'rgba(70,32,143,0.6)', 0.5);
  };
})(window.CD);
