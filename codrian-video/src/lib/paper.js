// Papel recortado: formas com borda irregular "fervendo" (boil), sombra projetada,
// textura de fibra e etiquetas de texto em tiras de papel.
(function (CD) {
  CD.initPaper = () => {
    const g = document.createElement('canvas'); g.width = g.height = 256;
    const x = g.getContext('2d'); const id = x.createImageData(256, 256);
    for (let i = 0; i < 256 * 256; i++) {
      const v = 200 + CD.rnd(i, 3) * 55; id.data[i * 4] = v; id.data[i * 4 + 1] = v; id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255;
    }
    x.putImageData(id, 0, 0);
    x.globalAlpha = 0.18; x.strokeStyle = '#777';
    for (let i = 0; i < 90; i++) { // fibras
      x.lineWidth = 0.6 + CD.rnd(i, 9) * 0.8; x.beginPath();
      const px = CD.rnd(i, 1) * 256, py = CD.rnd(i, 2) * 256, a = CD.rnd(i, 4) * 6.28, l = 8 + CD.rnd(i, 5) * 22;
      x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a + 1) * l * .5, py + Math.sin(a + 1) * l * .5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
    }
    CD.grain = CD.ctx.createPattern(g, 'repeat');
    // ruído de filme (4 variações)
    CD.film = [0, 1, 2, 3].map((k) => {
      const c = document.createElement('canvas'); c.width = c.height = 200; const cx = c.getContext('2d'); const d = cx.createImageData(200, 200);
      for (let i = 0; i < 40000; i++) { const v = CD.rnd(i, k, 7) * 255; d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255; }
      cx.putImageData(d, 0, 0); return CD.ctx.createPattern(c, 'repeat');
    });
  };

  // ---- geradores de pontos ----
  const subdiv = (pts, seg = 70) => {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]); const n = Math.max(1, Math.round(L / seg));
      for (let k = 0; k < n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
    }
    return out;
  };
  CD.R = (x, y, w, h, r = 0) => {
    if (!r) return subdiv([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
    r = Math.min(r, w / 2, h / 2); const p = [];
    const arc = (cx, cy, a0) => { for (let k = 0; k <= 4; k++) { const a = a0 + (k / 4) * Math.PI / 2; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
    arc(x + w - r, y + r, -Math.PI / 2); arc(x + w - r, y + h - r, 0); arc(x + r, y + h - r, Math.PI / 2); arc(x + r, y + r, Math.PI);
    return subdiv(p);
  };
  CD.E = (cx, cy, rx, ry = rx, n = 0) => {
    n = n || Math.max(12, Math.round((rx + ry) / 9)); const p = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
    return p;
  };
  CD.P = (pts) => subdiv(pts);

  const path = (ctx, p) => { ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]); ctx.closePath(); };
  CD.path = path;

  // Recorte de papel. o: {seed, amp, sh (profundidade da sombra), grain, edge, alpha}
  CD.cut = (pts, fill, o = {}) => {
    const ctx = CD.ctx, seed = o.seed ?? (pts.length * 3.1 + pts[0][0] * 0.01), amp = o.amp ?? 2.4;
    const p = amp ? pts.map((q, i) => [q[0] + CD.rs(seed, i, CD.boil) * amp, q[1] + CD.rs(seed + 7, i, CD.boil) * amp]) : pts;
    path(ctx, p);
    const sh = o.sh ?? 1, k = CD.S * CD.zNow;
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    if (sh > 0) { ctx.shadowColor = o.shc || 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 16 * sh * k; ctx.shadowOffsetX = 5 * sh * k; ctx.shadowOffsetY = 10 * sh * k; }
    ctx.fillStyle = fill; ctx.fill();
    ctx.restore();
    const gr = o.grain ?? 0.33;
    if (gr > 0) {
      ctx.save(); ctx.clip(); if (o.alpha != null) ctx.globalAlpha *= o.alpha; ctx.globalAlpha *= gr; ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = CD.grain; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const q of p) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); }
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0); ctx.restore();
    }
    if (o.edge !== false) { ctx.save(); if (o.alpha != null) ctx.globalAlpha *= o.alpha; ctx.strokeStyle = o.edgeC || 'rgba(255,255,255,0.13)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); }
    return p;
  };

  // Linhas tipo "lápis/caneta" para detalhes (boca, sobrancelha)
  CD.stroke = (pts, color, w = 6, seed = 1) => {
    const ctx = CD.ctx; ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
    pts.forEach((q, i) => { const x = q[0] + CD.rs(seed, i, CD.boil) * 1.2, y = q[1] + CD.rs(seed + 3, i, CD.boil) * 1.2; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.stroke(); ctx.restore();
  };

  CD.font = (size, fam = 'Anton', weight = '400') => `${weight} ${size}px ${fam}`;
  // texto simples com sombra leve
  CD.text = (s, x, y, o = {}) => {
    const ctx = CD.ctx; ctx.save(); ctx.font = CD.font(o.size || 60, o.fam || 'Anton', o.weight || '400');
    ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = o.color || CD.C.white;
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    if (o.shadow !== false) { ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowOffsetY = 4 * CD.S * CD.zNow; ctx.shadowBlur = 6 * CD.S * CD.zNow; }
    ctx.fillText(s, x, y); ctx.restore();
  };
  CD.measure = (s, size, fam = 'Anton', weight = '400') => { CD.ctx.save(); CD.ctx.font = CD.font(size, fam, weight); const w = CD.ctx.measureText(s).width; CD.ctx.restore(); return w; };

  // Tira de papel com texto (manchetes). Centralizada em x,y. sc = escala de entrada.
  CD.label = (s, x, y, o = {}) => {
    const ctx = CD.ctx, size = o.size || 90, fam = o.fam || 'Anton', pad = o.pad ?? size * 0.32;
    const w = CD.measure(s, size, fam, o.weight || '400') + pad * 2, h = size * 1.28;
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); const sc = o.sc ?? 1; ctx.scale(sc, sc);
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    CD.cut(CD.R(-w / 2, -h / 2, w, h), o.bg || CD.C.white, { seed: o.seed ?? s.length, sh: o.sh ?? 1.2, amp: 2.5 });
    CD.text(s, 0, size * 0.04, { size, fam, color: o.color || CD.C.ink, shadow: false, weight: o.weight });
    ctx.restore();
    return w;
  };
  // pedaço de fita adesiva
  CD.tape = (x, y, w = 90, rot = 0) => {
    const ctx = CD.ctx; ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    CD.cut(CD.P([[-w / 2, -16], [w / 2, -18], [w / 2 - 4, 16], [-w / 2 + 3, 18]]), 'rgba(235,225,190,0.55)', { sh: 0.2, grain: 0.2, edge: false });
    ctx.restore();
  };
})(window.CD);
