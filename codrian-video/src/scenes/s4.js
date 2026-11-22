// CENA 04 — A TRANSFORMAÇÃO CODRIAN (14.5–23.2s)
// congela o cemitério, luz roxa surge do buraco, o cenário se rasga em pedaços
// e peças de papel voam para montar a landing page, sincronizadas com a narração.
(function (CD) {
  const C = CD.C, E = CD.ease;
  const LPX = 540, LPY = 860, LPS = 1.0;
  CD.scene.s4 = (t) => {
    if (!CD.cache.freeze) {
      CD.cache.freeze = CD.snap(() => { const keep = [CD.step, CD.ta, CD.boil]; CD.scene.s3(14.45); [CD.step, CD.ta, CD.boil] = keep; });
      CD.cache.hole = CD.toScreen(3340, 1470, 1);
      CD.cache.sh = CD.shards(7, 12, 5);
    }
    CD.screen(); CD.setCam(540, 960, 1, 0);
    const [hx, hy] = CD.cache.hole;
    // fundo roxo profundo atrás do cenário
    CD.fill('#0d0718');
    const light = E.out(CD.prog(t, 14.7, 15.5));
    CD.glow(540, 900, 1300, 'rgba(123,63,228,1)', 0.55 * light);
    CD.glow(540, 900, 600, 'rgba(167,123,255,1)', 0.35 * light);
    // partículas de papel flutuando
    for (let i = 0; i < 26; i++) {
      const a = CD.prog(t, 15.4, 16.2); if (a <= 0) break;
      const x = (CD.rnd(i, 1) * 1180 + CD.ta * 30 * (0.5 + CD.rnd(i, 2))) % 1180 - 50, y = (CD.rnd(i, 3) * 2000 - CD.ta * 60 * (0.5 + CD.rnd(i, 4))) % 2000;
      CD.ctx.save(); CD.ctx.translate(x, y < 0 ? y + 2000 : y); CD.ctx.rotate(CD.ta * (CD.rnd(i, 5) - 0.5) * 2);
      CD.cut(CD.R(-10, -14, 20 + CD.rnd(i, 6) * 18, 28), i % 3 ? C.purple : C.green, { seed: 500 + i, sh: 0.4, alpha: 0.75 * a });
      CD.ctx.restore();
    }
    // quadro congelado → rasga e voa
    const fr = CD.prog(t, 14.5, 14.62);
    const gray = CD.prog(t, 14.5, 14.7);
    const fly = (s) => {
      const dx = s.cx - hx, dy = s.cy - hy, L = Math.hypot(dx, dy) || 1, delay = (1 - CD.clamp(L / 1400)) * 0.2 + s.r * 0.15;
      const k = E.inOut(CD.prog(t, 15.35 + delay, 16.0 + delay));
      const crack = CD.prog(t, 15.0, 15.45) * (1 - k);
      return { x: dx / L * (1900 * k + 10 * crack), y: dy / L * (1900 * k + 10 * crack) + 500 * k * k, rot: CD.rs(s.r, 3) * 3.2 * k + CD.rs(s.r, 4) * 0.03 * crack, sc: 1 + 0.4 * k, a: 1, lift: Math.min(1, crack * 2 + k) };
    };
    if (t < 16.9) {
      CD.ctx.save(); CD.ctx.filter = `grayscale(${gray}) brightness(${1 - 0.3 * gray})`;
      if (t < 15.0) { CD.ctx.setTransform(1, 0, 0, 1, 0, 0); CD.ctx.drawImage(CD.cache.freeze, 0, 0); CD.screen(); }
      else CD.drawShards(CD.cache.freeze, CD.cache.sh, fly, t < 15.4 ? `rgba(190,150,255,${0.9 * CD.prog(t, 15.0, 15.3)})` : null);
      CD.ctx.restore();
      // luz roxa vaza pelo buraco e pelas rachaduras
      CD.glow(hx, hy, 900 * light + 50, 'rgba(140,80,255,1)', 0.7 * light * (1 - CD.prog(t, 15.5, 16.4)));
    }
    if (fr < 1) CD.fill('#fff', 0.5 * (1 - fr));
    // montagem da landing page
    if (t >= 16.4) {
      const dr = Math.sin(CD.ta * 1.3) * 0.006;
      const ctx = CD.ctx; ctx.save(); ctx.translate(LPX, LPY); ctx.rotate(dr); ctx.translate(-LPX, -LPY);
      CD.glow(LPX, LPY, 900, 'rgba(123,63,228,1)', 0.45);
      const press = t > 22.2 && t < 22.4 ? 0.94 : 1;
      CD.drawLP(LPX, LPY, LPS, { t, press });
      // brilho do CTA após o clique
      if (t > 22.25) { const k = CD.prog(t, 22.25, 22.9); CD.glow(LPX, LPY - 625 + 1178, 300 + 300 * k, 'rgba(47,214,123,1)', 0.7 * (1 - k * 0.6));
        for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28, r = 120 + k * 300; CD.cut(CD.R(LPX + Math.cos(a) * r * 1.6 - 8, LPY + 553 + Math.sin(a) * r * 0.6 - 8, 16, 16), i % 2 ? C.green : C.white, { seed: 520 + i, sh: 0.3, alpha: 1 - k }); } }
      ctx.restore();
      // cursor (mão)
      if (t > CD.K.oport - 0.25) {
        const k = E.inOut(CD.prog(t, CD.K.oport - 0.25, 22.15));
        const px = CD.lerp(980, 640, k), py = CD.lerp(1850, 1440, k) + (t > 22.2 && t < 22.4 ? 12 : 0);
        CD.pointer(px, py, 1.1);
      }
    }
  };
})(window.CD);
