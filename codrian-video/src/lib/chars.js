// Personagens e objetos de papel reutilizáveis.
(function (CD) {
  const C = CD.C;
  const seg = (a, b, w, col, seed) => { // membro (retângulo arredondado de a até b)
    const ctx = CD.ctx, L = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    ctx.save(); ctx.translate(a[0], a[1]); ctx.rotate(ang); CD.cut(CD.R(-w / 2, -w / 2, L + w, w, w / 2), col, { seed, sh: 0.6 }); ctx.restore();
  };
  CD.seg = seg;

  // ---------- EMPRESÁRIO (meio corpo; y = cintura) ----------
  // o: {mood:'neutral'|'worried'|'sad'|'happy', talk:0..1, blink, look:[x,y], phoneArm: [hx,hy] | null, sweat:0..1, wave}
  CD.owner = (x, y, s = 1, o = {}) => {
    const ctx = CD.ctx; ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const mood = o.mood || 'neutral', bob = Math.sin(CD.ta * 3) * 3;
    ctx.translate(0, bob);
    const shirt = '#3d4b69', apron = '#d8d0bf';
    // braço de trás (apoiado)
    seg([125, -300], [175, -140], 58, shirt, 21); seg([175, -140], [120, -20], 54, shirt, 22);
    // tronco
    CD.cut(CD.P([[-150, -335], [150, -335], [135, 10], [-135, 10]]), shirt, { seed: 11, sh: 1.2 });
    CD.cut(CD.P([[-92, -250], [92, -250], [112, 10], [-112, 10]]), apron, { seed: 12, sh: 0.5 });
    CD.cut(CD.R(-50, -150, 100, 60, 6), '#c9c0ad', { seed: 13, sh: 0.3 });
    CD.stroke([[-92, -250], [-60, -330]], apron, 10, 14); CD.stroke([[92, -250], [60, -330]], apron, 10, 15);
    // pescoço + cabeça
    CD.cut(CD.R(-34, -385, 68, 70), C.skinD, { seed: 16, sh: 0.3 });
    CD.cut(CD.E(-92, -432, 18, 27), C.skinD, { seed: 17, sh: 0.4 });
    CD.cut(CD.E(92, -432, 18, 27), C.skinD, { seed: 18, sh: 0.4 });
    CD.cut(CD.E(0, -435, 92, 106), C.skin, { seed: 19, sh: 0.9 });
    // cabelo (lateral + topo ralo)
    CD.cut(CD.P([[-98, -440], [-104, -500], [-70, -540], [-20, -552], [10, -530], [40, -552], [80, -532], [102, -490], [98, -440], [84, -470], [60, -500], [-60, -500], [-86, -470]]), C.hair, { seed: 20, sh: 0.6 });
    // olhos
    const bl = o.blink ? 2 : 12, lk = o.look || [0, 0];
    CD.cut(CD.E(-34 + lk[0], -445 + lk[1], 9, bl, 10), C.ink, { seed: 23, sh: 0, grain: 0, edge: false });
    CD.cut(CD.E(34 + lk[0], -445 + lk[1], 9, bl, 10), C.ink, { seed: 24, sh: 0, grain: 0, edge: false });
    // sobrancelhas por humor
    const br = { neutral: [0, 0], worried: [-14, 8], sad: [-16, 10], happy: [-6, -6] }[mood];
    CD.stroke([[-58, -472 - br[1] * 0.2], [-14, -472 + br[0]]], C.hair, 9, 25);
    CD.stroke([[58, -472 - br[1] * 0.2], [14, -472 + br[0]]], C.hair, 9, 26);
    // nariz e bigode
    CD.cut(CD.E(0, -410, 17, 24), C.skinD, { seed: 27, sh: 0.4 });
    CD.cut(CD.P([[-52, -384], [-20, -396], [0, -390], [20, -396], [52, -384], [36, -370], [0, -378], [-36, -370]]), C.hair, { seed: 28, sh: 0.4 });
    // boca
    const tk = o.talk || 0;
    if (tk > 0.05) CD.cut(CD.E(0, -352, 20, 6 + tk * 14), '#3a1418', { seed: 29, sh: 0, edge: false });
    else if (mood === 'happy') CD.stroke([[-30, -360], [0, -342], [30, -360]], '#3a1418', 7, 30);
    else if (mood === 'sad' || mood === 'worried') CD.stroke([[-24, -344], [0, -354], [24, -344]], '#3a1418', 7, 31);
    else CD.stroke([[-20, -352], [20, -352]], '#3a1418', 7, 32);
    if (o.sweat > 0) CD.cut(CD.P([[112, -500], [124, -470], [112, -460], [100, -470]]), '#9fd3ff', { seed: 33, sh: 0.3, alpha: o.sweat });
    // braço da frente (segurando telefone ou apoiado)
    if (o.phoneArm) {
      const h = o.phoneArm; seg([-125, -300], [-205, -170], 60, shirt, 34); seg([-205, -170], h, 56, shirt, 35);
      if (o.drawInHand) o.drawInHand(h);
      CD.cut(CD.E(h[0], h[1], 30, 30), C.skin, { seed: 36, sh: 0.5 });
    } else {
      seg([-125, -300], [-180, -140], 60, shirt, 34); seg([-180, -140], [-110, -20], 56, shirt, 35);
    }
    ctx.restore();
  };

  // ---------- CLIENTE (corpo inteiro, y = pés) ----------
  // o: {col, hair, face:1|-1, walk:fase|null, front:bool, phone:bool, alpha}
  CD.person = (x, y, s = 1, o = {}) => {
    const ctx = CD.ctx; ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.face || 1), s);
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    const col = o.col || '#5b6c8f', pants = o.pants || '#262230', ph = o.walk, seed = o.seed || 1;
    const sw = ph == null ? 0 : Math.sin(ph) * 0.5, bob = ph == null ? 0 : Math.abs(Math.cos(ph)) * -8;
    ctx.translate(0, bob);
    const leg = (a, k) => { ctx.save(); ctx.translate(0, -110); ctx.rotate(a); CD.cut(CD.R(-13, 0, 26, 108, 8), pants, { seed: seed + k, sh: 0.5 }); CD.cut(CD.E(10, 108, 22, 11), C.ink, { seed: seed + k + 1, sh: 0.3 }); ctx.restore(); };
    leg(-sw, 2); leg(sw, 4);
    const arm = (a, k) => { ctx.save(); ctx.translate(0, -215); ctx.rotate(a); CD.cut(CD.R(-12, 0, 24, 100, 10), col, { seed: seed + k, sh: 0.5 }); CD.cut(CD.E(0, 102, 13, 13), C.skin, { seed: seed + k + 1, sh: 0.2 }); ctx.restore(); };
    if (!o.front) arm(sw * 0.8, 6);
    CD.cut(CD.R(-40, -240, 80, 140, 26), col, { seed: seed + 8, sh: 0.8 });
    if (o.front) { arm(0.25, 6); arm(-0.25, 10); }
    else if (o.phone) { ctx.save(); ctx.translate(0, -215); ctx.rotate(-1.1); CD.cut(CD.R(-12, 0, 24, 70, 10), col, { seed: seed + 12, sh: 0.5 }); ctx.restore(); CD.cut(CD.R(44, -286, 26, 44, 5), C.ink, { seed: seed + 13, sh: 0.4 }); CD.cut(CD.R(48, -282, 18, 34, 3), C.purpleL, { seed: seed + 14, sh: 0, grain: 0 }); }
    else arm(-sw * 0.8, 10);
    CD.cut(CD.E(0, -276, 38, 40), C.skin, { seed: seed + 15, sh: 0.7 });
    CD.cut(CD.P([[-40, -280], [-36, -308], [-10, -322], [24, -318], [42, -296], [40, -282], [20, -296], [-20, -298]]), o.hair || C.hair, { seed: seed + 16, sh: 0.4 });
    if (o.front) { CD.cut(CD.E(-13, -274, 4.5, 6), C.ink, { sh: 0, grain: 0, edge: false, seed: 1 }); CD.cut(CD.E(13, -274, 4.5, 6), C.ink, { sh: 0, grain: 0, edge: false, seed: 2 }); }
    else { CD.cut(CD.E(20, -276, 4.5, 6), C.ink, { sh: 0, grain: 0, edge: false, seed: 3 }); CD.cut(CD.E(38, -266, 7, 7), C.skinD, { sh: 0.2, seed: seed + 17 }); }
    ctx.restore();
  };

  // ---------- TELEFONE ANTIGO ----------
  CD.phoneBase = (x, y, shake = [0, 0]) => {
    const ctx = CD.ctx; ctx.save(); ctx.translate(x + shake[0], y + shake[1]);
    CD.cut(CD.P([[-100, 0], [100, 0], [78, -78], [-78, -78]]), C.greenD, { seed: 41, sh: 1 });
    CD.cut(CD.E(0, -40, 32, 30), C.white, { seed: 42, sh: 0.4 });
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; CD.cut(CD.E(Math.cos(a) * 20, -40 + Math.sin(a) * 19, 4, 4, 8), C.ink, { sh: 0, grain: 0, edge: false, seed: 43 + i }); }
    ctx.restore();
  };
  CD.handset = (x, y, rot = 0) => {
    const ctx = CD.ctx; ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    CD.cut(CD.R(-92, -14, 184, 28, 14), C.green, { seed: 51, sh: 1 });
    CD.cut(CD.E(-84, 6, 30, 20), C.green, { seed: 52, sh: 0.6 });
    CD.cut(CD.E(84, 6, 30, 20), C.green, { seed: 53, sh: 0.6 });
    ctx.restore();
  };
  CD.cord = (a, b, n = 14) => {
    const ctx = CD.ctx; ctx.save(); ctx.strokeStyle = C.greenD; ctx.lineWidth = 5; ctx.beginPath();
    for (let i = 0; i <= n * 4; i++) {
      const t = i / (n * 4), x = CD.lerp(a[0], b[0], t), y = CD.lerp(a[1], b[1], t) + Math.sin(t * Math.PI) * 60, c = Math.sin(t * n * Math.PI * 2) * 9;
      i ? ctx.lineTo(x + c, y + Math.cos(t * n * Math.PI * 2) * 6) : ctx.moveTo(x, y);
    }
    ctx.stroke(); ctx.restore();
  };

  // ---------- SMARTPHONE (tela via callback em coords locais) ----------
  CD.smartphone = (x, y, w, h, rot, screen, o = {}) => {
    const ctx = CD.ctx; ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
    CD.cut(CD.R(-w / 2, -h / 2, w, h, w * 0.12), o.body || '#18141f', { seed: 61, sh: o.sh ?? 1.4 });
    const m = w * 0.05, sw = w - m * 2, sh = h - m * 2 - w * 0.06;
    ctx.save(); ctx.translate(-sw / 2, -h / 2 + m + w * 0.06);
    CD.path(ctx, CD.R(0, 0, sw, sh, w * 0.07)); ctx.clip();
    ctx.fillStyle = o.screenBg || '#f4f1ea'; ctx.fillRect(0, 0, sw, sh);
    if (screen) screen(sw, sh);
    ctx.restore();
    CD.cut(CD.R(-w * 0.12, -h / 2 + m * 0.7, w * 0.24, w * 0.035, 6), '#000', { sh: 0, grain: 0, edge: false, seed: 62 });
    ctx.restore();
  };

  // ---------- BALÃO DE FALA ----------
  CD.bubble = (x, y, text, o = {}) => {
    const ctx = CD.ctx, size = o.size || 54, fam = o.fam || 'Inter', wt = o.weight || '800';
    const lines = text.split('\n'); const tw = Math.max(...lines.map((l) => CD.measure(l, size, fam, wt)));
    const w = tw + size * 1.4, h = lines.length * size * 1.2 + size * 0.9;
    ctx.save(); ctx.translate(x, y); const sc = o.sc ?? 1; if (sc <= 0.001) { ctx.restore(); return; } ctx.scale(sc, sc); ctx.rotate(o.rot || 0);
    const tx = o.tail || [-w * 0.3, h * 0.75];
    CD.cut(CD.P([[-w * 0.18, h * 0.3], [tx[0], tx[1]], [w * 0.02, h * 0.36]]), o.bg || C.white, { seed: 71, sh: 0.8 });
    CD.cut(CD.E(0, 0, w / 2 + 10, h / 2 + 6), o.bg || C.white, { seed: 72, sh: 1 });
    lines.forEach((l, i) => CD.text(l, 0, (i - (lines.length - 1) / 2) * size * 1.2, { size, fam, weight: wt, color: o.color || C.ink, shadow: false }));
    ctx.restore();
  };

  // ---------- ÍCONES de papel ----------
  CD.icon = (kind, x, y, r, col = C.purple) => {
    const ctx = CD.ctx; ctx.save(); ctx.translate(x, y);
    CD.cut(CD.E(0, 0, r, r), col, { seed: 80 + kind.length, sh: 0.5 });
    const w = C.white;
    if (kind === 'star') { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.26 : r * 0.6; p.push([Math.cos(a) * rr, Math.sin(a) * rr]); } CD.cut(p, w, { sh: 0, amp: 1, seed: 90 }); }
    if (kind === 'check') CD.stroke([[-r * .35, 0], [-r * .08, r * .3], [r * .4, -r * .3]], w, r * 0.16, 91);
    if (kind === 'chat') { CD.cut(CD.R(-r * .45, -r * .35, r * .9, r * .55, r * .15), w, { sh: 0, amp: 1, seed: 92 }); CD.cut(CD.P([[-r * .2, r * .15], [-r * .3, r * .42], [r * .05, r * .18]]), w, { sh: 0, amp: 1, seed: 93 }); }
    if (kind === 'clock') { CD.cut(CD.E(0, 0, r * .55, r * .55), w, { sh: 0, amp: 1, seed: 94 }); CD.stroke([[0, -r * .35], [0, 0], [r * .25, r * .12]], col, r * .1, 95); }
    if (kind === 'pin') { CD.cut(CD.P([[0, r * .55], [-r * .38, -r * .05], [-r * .3, -r * .38], [0, -r * .55], [r * .3, -r * .38], [r * .38, -r * .05]]), w, { sh: 0, amp: 1, seed: 96 }); CD.cut(CD.E(0, -r * .15, r * .14, r * .14), col, { sh: 0, amp: 0, seed: 97 }); }
    if (kind === 'phone') { ctx.rotate(-0.6); CD.cut(CD.R(-r * .14, -r * .5, r * .28, r * 1, r * .12), w, { sh: 0, amp: 1, seed: 98 }); }
    ctx.restore();
  };

  // ponteiro (mão) de papel
  CD.pointer = (x, y, sc = 1) => {
    const ctx = CD.ctx; ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.rotate(-0.35);
    CD.cut(CD.R(-14, -6, 28, 70, 14), C.white, { seed: 101, sh: 1 });
    CD.cut(CD.R(-30, 44, 70, 74, 22), C.white, { seed: 102, sh: 1 });
    CD.cut(CD.R(-34, 110, 74, 50, 8), C.purple, { seed: 103, sh: 0.6 });
    ctx.restore();
  };
})(window.CD);
