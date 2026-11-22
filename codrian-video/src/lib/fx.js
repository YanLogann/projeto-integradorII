// Luz, pós-processamento, cache de quadros, estilhaços de papel e legendas.
(function (CD) {
  const C = CD.C;
  // Luz aditiva (screen) radial
  CD.glow = (x, y, r, col, a = 1, mode = 'screen') => {
    const ctx = CD.ctx; ctx.save(); ctx.globalCompositeOperation = mode; ctx.globalAlpha *= a;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  };
  // Escuridão com "furo" de luz (iluminação dramática de estúdio)
  CD.dark = (x, y, r, amt, col = '8,5,14') => {
    const ctx = CD.ctx; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const S = CD.S; const g = ctx.createRadialGradient(x * S, y * S, r * S * 0.15, x * S, y * S, r * S);
    g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(1, `rgba(${col},${amt})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, CD.W * S, CD.H * S); ctx.restore();
  };
  CD.fill = (col, a = 1) => { const ctx = CD.ctx; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fillRect(0, 0, CD.W * CD.S, CD.H * CD.S); ctx.restore(); };

  // Pós: vinheta, flicker de exposição (stop motion) e grão de filme
  CD.post = (o = {}) => {
    const ctx = CD.ctx, S = CD.S; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const W = CD.W * S, H = CD.H * S;
    const g = ctx.createRadialGradient(W / 2, H * 0.48, H * 0.25, W / 2, H * 0.5, H * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${o.vig ?? 0.6})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = `rgba(0,0,0,${0.035 * CD.rnd(CD.step, 99)})`; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.09;
    ctx.translate(CD.rnd(CD.frame, 1) * 200, CD.rnd(CD.frame, 2) * 200); ctx.scale(S * 1.5, S * 1.5);
    ctx.fillStyle = CD.film[CD.frame % 4]; ctx.fillRect(-200, -200, W / S + 400, H / S + 400);
    ctx.restore();
  };

  // Renderiza algo num canvas fora da tela (para congelar / despedaçar)
  CD.snap = (fn) => {
    const c = document.createElement('canvas'); c.width = CD.cv.width; c.height = CD.cv.height;
    const prev = CD.ctx; CD.ctx = c.getContext('2d'); CD.ctx.setTransform(CD.S, 0, 0, CD.S, 0, 0); fn(); CD.ctx = prev; return c;
  };
  CD.cache = {};

  // Grade de estilhaços irregulares cobrindo a tela
  CD.shards = (cols, rows, seed) => {
    const pt = (i, j) => [i / cols * CD.W + ((i > 0 && i < cols) ? CD.rs(seed, i, j) * CD.W / cols * 0.35 : 0) + (i === 0 ? -30 : i === cols ? 30 : 0),
      j / rows * CD.H + ((j > 0 && j < rows) ? CD.rs(seed + 1, i, j) * CD.H / rows * 0.35 : 0) + (j === 0 ? -30 : j === rows ? 30 : 0)];
    const out = [];
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1);
      const tris = CD.rnd(seed, i * 7, j) > 0.5 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]];
      for (const p of tris) out.push({ p, cx: (p[0][0] + p[1][0] + p[2][0]) / 3, cy: (p[0][1] + p[1][1] + p[2][1]) / 3, r: CD.rnd(seed, i, j * 3 + out.length) });
    }
    return out;
  };
  // desenha a imagem recortada em estilhaços; f(sh) -> {x,y,rot,sc,a} deslocamentos
  CD.drawShards = (img, list, f, rim) => {
    const ctx = CD.ctx;
    for (const s of list) {
      const m = f(s); if (m.a <= 0.01) continue;
      ctx.save(); ctx.globalAlpha *= m.a;
      ctx.translate(s.cx + m.x, s.cy + m.y); ctx.rotate(m.rot); ctx.scale(m.sc, m.sc); ctx.translate(-s.cx, -s.cy);
      CD.path(ctx, s.p);
      if (m.lift > 0.05) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 20 * CD.S * m.lift; ctx.shadowOffsetY = 18 * CD.S * m.lift; ctx.fillStyle = '#000'; ctx.fill(); ctx.restore(); }
      const ex = s.p.map((q) => { const dx = q[0] - s.cx, dy = q[1] - s.cy, L = Math.hypot(dx, dy) || 1; return [q[0] + dx / L * 2.5, q[1] + dy / L * 2.5]; });
      CD.path(ctx, ex);
      ctx.save(); ctx.clip(); ctx.setTransform(ctx.getTransform().scale(1 / CD.S, 1 / CD.S)); ctx.drawImage(img, 0, 0); ctx.restore();
      if (rim) { ctx.strokeStyle = rim; ctx.lineWidth = 3; ctx.stroke(); }
      ctx.restore();
    }
  };

  // ---------- LEGENDAS (palavra a palavra, do alinhamento da ElevenLabs) ----------
  CD.buildCaptions = () => {
    const chunks = [];
    for (const id of ['n1', 'n2', 'n3', 'n4', 'n5']) {
      const ws = CD.VO[id].words; let cur = [];
      ws.forEach((w, i) => {
        cur.push({ w: w.w, s: CD.T[id] + w.s, e: CD.T[id] + w.e });
        const len = cur.map((x) => x.w).join(' ').length;
        if (/[.,:?!…]$/.test(w.w) || len > 15 || i === ws.length - 1) { chunks.push(cur); cur = []; }
      });
    }
    chunks.forEach((c, i) => { c.s = c[0].s; c.e = (chunks[i + 1] && chunks[i + 1][0].s - c[c.length - 1].e < 0.5) ? chunks[i + 1][0].s : c[c.length - 1].e + 0.35; });
    CD.capChunks = chunks;
  };
  CD.captions = (t, y = 1600) => {
    const ch = CD.capChunks.find((c) => t >= c.s && t < c.e); if (!ch) return;
    const ctx = CD.ctx, size = 56, words = ch.map((w) => w.w.toUpperCase());
    const sp = 16, ws = words.map((w) => CD.measure(w, size, 'Inter', '800')); const tot = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
    const pin = CD.ease.back(CD.prog(t, ch.s, ch.s + 0.18));
    ctx.save(); ctx.translate(CD.W / 2, y); ctx.scale(0.85 + 0.15 * pin, 0.85 + 0.15 * pin);
    CD.cut(CD.R(-tot / 2 - 28, -size * 0.75, tot + 56, size * 1.5, 10), 'rgba(14,11,20,0.88)', { seed: ch.s * 10, sh: 0.6, grain: 0.15, amp: 1.5 });
    let x = -tot / 2;
    ch.forEach((w, i) => {
      const on = t >= w.s; const act = t >= w.s && t < (ch[i + 1] ? ch[i + 1].s : ch.e);
      CD.text(words[i], x + ws[i] / 2, 3, { size, fam: 'Inter', weight: '800', color: act ? C.green : on ? C.white : 'rgba(244,241,234,0.35)', shadow: false });
      x += ws[i] + sp;
    });
    ctx.restore();
  };
})(window.CD);
