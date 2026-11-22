// CENA 06 — REVELAÇÃO DA MARCA (29.4–34.5s)
(function (CD) {
  const C = CD.C, E = CD.ease;
  const WORD = 'CODRIAN', FS = 250, LY = 820;
  CD.scene.s6 = (t) => {
    const K = CD.K;
    if (!CD.cache.end) {
      CD.cache.end = CD.snap(() => { const keep = [CD.step, CD.ta, CD.boil]; CD.scene.s5(29.35); CD.screen(); CD.captions(29.35); [CD.step, CD.ta, CD.boil] = keep; });
      CD.cache.endSh = CD.shards(6, 10, 9);
      // estilhaços das letras
      const widths = [...WORD].map((ch) => CD.measure(ch, FS)), sp = 6, tot = widths.reduce((a, b) => a + b, 0) + sp * (WORD.length - 1);
      let x = 540 - tot / 2; CD.cache.letters = [];
      [...WORD].forEach((ch, i) => {
        const cx = x + widths[i] / 2; x += widths[i] + sp;
        const frags = []; const gx = 2, gy = 3, w = widths[i] + 20, h = FS * 1.0;
        for (let a = 0; a < gx; a++) for (let b = 0; b < gy; b++) {
          const x0 = cx - w / 2 + a * w / gx, y0 = LY - h / 2 + b * h / gy, x1 = x0 + w / gx, y1 = y0 + h / gy;
          const tris = (a + b) % 2 ? [[[x0, y0], [x1, y0], [x1, y1]], [[x0, y0], [x1, y1], [x0, y1]]] : [[[x0, y0], [x1, y0], [x0, y1]], [[x1, y0], [x1, y1], [x0, y1]]];
          tris.forEach((p, k) => frags.push({ p, ox: CD.rs(i, a * 9 + b * 3 + k) * 900, oy: CD.rs(i + 5, a * 7 + b * 5 + k) * 1300, or: CD.rs(i, a + b * 3 + k * 11) * 4, col: (a + b + k + i) % 3 ? C.purple : C.green }));
        }
        CD.cache.letters.push({ ch, cx, frags });
      });
    }
    CD.screen(); CD.setCam(540, 960, 1, 0);
    CD.fill('#07050b');
    // cenário anterior cai em pedaços
    if (t < 30.4) {
      CD.drawShards(CD.cache.end, CD.cache.endSh, (s) => {
        const k = CD.prog(t, 29.4 + s.r * 0.35, 30.25 + s.r * 0.35);
        return { x: CD.rs(s.r, 2) * 120 * k, y: E.in(k) * 1700, rot: CD.rs(s.r, 3) * 1.5 * k, sc: 1, a: 1 - CD.prog(k, 0.6, 1), lift: Math.min(1, k * 3) };
      });
    }
    // confete de papel ao fundo
    const hit = CD.prog(t, K.logo, K.logo + 0.6);
    for (let i = 0; i < 30; i++) {
      const a = CD.prog(t, 30.0, 30.6); if (a <= 0) break;
      const x = CD.rnd(i, 1) * 1080, y = ((CD.rnd(i, 2) * 2100 + CD.ta * (40 + CD.rnd(i, 3) * 60)) % 2100) - 100;
      CD.ctx.save(); CD.ctx.translate(x, y); CD.ctx.rotate(CD.ta * (CD.rnd(i, 4) - 0.5) * 3);
      CD.cut(CD.R(-8, -12, 14 + CD.rnd(i, 6) * 14, 22), i % 3 ? C.purpleD : C.greenD, { seed: 700 + i, sh: 0.3, alpha: 0.6 * a });
      CD.ctx.restore();
    }
    CD.glow(540, LY, 900, 'rgba(123,63,228,1)', 0.35 + 0.5 * (1 - hit) * (t > K.logo ? 1 : 0));
    // logo: fragmentos voando e encaixando
    const punch = t > K.logo ? 1 + 0.08 * (1 - E.out(hit)) : 1;
    const ctx = CD.ctx; ctx.save(); ctx.translate(540, LY); ctx.scale(punch, punch); ctx.translate(-540, -LY);
    CD.cache.letters.forEach((L, i) => {
      const t0 = 29.75 + i * 0.07, t1 = K.logo;
      if (t < t0) return;
      const k = E.out(CD.prog(t, t0, t1));
      if (t < t1) {
        for (const f of L.frags) {
          const m = 1 - k; ctx.save(); ctx.translate(f.ox * m, f.oy * m); const c = [L.cx, LY]; ctx.translate(c[0], c[1]); ctx.rotate(f.or * m); ctx.translate(-c[0], -c[1]);
          CD.path(ctx, f.p); ctx.clip();
          CD.text(L.ch, L.cx, LY, { size: FS, color: f.col, shadow: false });
          ctx.restore();
        }
      } else {
        // letra final: camadas de papel (verde, roxo, branco)
        const b = Math.sin(CD.ta * 2 + i) * 2;
        CD.text(L.ch, L.cx + 10, LY + 12 + b, { size: FS, color: C.purpleD, shadow: false });
        CD.text(L.ch, L.cx + 5, LY + 6 + b, { size: FS, color: C.purple, shadow: false });
        CD.text(L.ch, L.cx, LY + b, { size: FS, color: C.white });
      }
    });
    ctx.restore();
    if (t > K.logo) {
      CD.fill('#fff', 0.55 * (1 - CD.prog(t, K.logo, K.logo + 0.2)));
      const ul = E.out(CD.prog(t, K.logo + 0.15, K.logo + 0.55));
      CD.cut(CD.R(540 - 300 * ul, LY + 150, 600 * ul + 1, 18, 9), C.green, { seed: 720, sh: 0.6 });
    }
    if (t > 31.55) CD.label('SUA EMPRESA.', 540, 1090, { size: 92, rot: -0.03, sc: CD.lerp(1.6, 1, E.back(CD.prog(t, 31.55, 31.7))) });
    if (t > 31.95) CD.label('SUA PRESENÇA DIGITAL.', 540, 1215, { size: 80, rot: 0.025, bg: C.purple, color: C.white, sc: CD.lerp(1.6, 1, E.back(CD.prog(t, 31.95, 32.1))) });
    if (t > 32.8) {
      const p = CD.pop(t, 32.8, 0.35), pul = 1 + 0.035 * Math.sin((t - 32.8) * 6);
      ctx.save(); ctx.translate(540, 1395); ctx.scale(p * pul, p * pul);
      CD.cut(CD.R(-260, -54, 520, 108, 54), C.green, { seed: 730, sh: 1.3 });
      CD.text('SIGA @CODRIAN', 0, 3, { size: 58, color: C.ink, shadow: false });
      ctx.restore();
      CD.glow(540, 1395, 360, 'rgba(47,214,123,1)', 0.25 * p);
    }
  };
})(window.CD);
