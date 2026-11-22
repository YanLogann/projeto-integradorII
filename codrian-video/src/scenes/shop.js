// Cenário reutilizável: a pequena loja de papelão (cenas 1, 2 e 5).
(function (CD) {
  const C = CD.C;
  // o: {lit:0..1 (loja viva), owner:{...}, phoneShake, handset:{x,y,rot}|null, door:fn, front:fn, ownerX}
  CD.drawShop = (t, o = {}) => {
    const lit = o.lit || 0;
    // parede
    CD.layer(0.7, () => {
      CD.cut(CD.R(-500, -300, 2080, 1700), CD.lerpCol('#241d30', '#3a2d4c', lit), { sh: 0, amp: 0, seed: 1, grain: 0.45 });
      for (let i = -4; i < 14; i++) CD.cut(CD.R(i * 120 + 40, -300, 34, 1700), CD.lerpCol('#2a2237', '#43345a', lit), { sh: 0, amp: 1, seed: 2 + i, grain: 0.2, edge: false });
      CD.cut(CD.R(-500, 1300, 2080, 60), '#1a1422', { sh: 0.5, seed: 30 });
      // relógio
      CD.cut(CD.E(250, 380, 70, 70), C.white, { seed: 31, sh: 1 }); CD.cut(CD.E(250, 380, 56, 56), '#e9e2d3', { seed: 32, sh: 0, edge: false });
      CD.stroke([[250, 380], [250, 336]], C.ink, 7, 33); CD.stroke([[250, 380], [282, 392]], C.ink, 7, 34);
      // quadro na parede
      CD.cut(CD.R(560, 230, 150, 110, 4), C.cardD, { seed: 35, sh: 1 }); CD.cut(CD.R(574, 244, 122, 82), CD.lerpCol('#3f3a4a', '#7b3fe4', lit * 0.6), { seed: 36, sh: 0, edge: false });
    });
    // prateleiras
    CD.layer(0.8, () => {
      for (const [y, k] of [[640, 0], [860, 1]]) {
        CD.cut(CD.R(40, y, 380, 26), C.cardL, { seed: 40 + k, sh: 1 });
        const cols = ['#5d4a7d', '#3c6b57', '#7a6a55', '#4b4363', '#2fd67b'];
        for (let i = 0; i < 5; i++) { const h = 70 + CD.rnd(i, k) * 60, w = 50 + CD.rnd(k, i) * 20; CD.cut(CD.R(60 + i * 72, y - h, w, h, 6), CD.lerpCol(CD.darken(cols[(i + k) % 5], 0.55), cols[(i + k) % 5], lit), { seed: 50 + i + k * 9, sh: 0.6 }); }
      }
    });
    // porta (abertura com luz da rua)
    CD.layer(0.82, () => {
      CD.cut(CD.R(740, 520, 270, 860, 4), '#3a2a20', { seed: 60, sh: 1.2 });
      CD.cut(CD.R(772, 552, 206, 830), CD.lerpCol('#5a5070', '#9b8bc4', lit), { seed: 61, sh: 0, edge: false, grain: 0.25 });
      CD.glow(875, 900, 300, 'rgba(160,140,220,0.5)', 0.4 + lit * 0.5);
      if (o.door) { CD.ctx.save(); CD.path(CD.ctx, CD.R(772, 552, 206, 830)); CD.ctx.clip(); o.door(); CD.ctx.restore(); }
      // placa ABERTO
      CD.stroke([[830, 552], [830, 600]], '#222', 3, 62); CD.stroke([[920, 552], [920, 600]], '#222', 3, 63);
      const sg = lit > 0.5 ? C.green : '#3e5a4b';
      CD.cut(CD.R(800, 596, 150, 62, 6), sg, { seed: 64, sh: 1, rot: 0 });
      CD.text('ABERTO', 875, 628, { size: 36, color: lit > 0.5 ? C.ink : '#1d2a23', shadow: false });
      if (lit > 0.5) CD.glow(875, 628, 160, 'rgba(47,214,123,0.8)', (lit - 0.5) * 1.4);
    });
    // luminária
    CD.layer(0.88, () => {
      CD.stroke([[520, -200], [520, 300]], '#111', 4, 70);
      CD.cut(CD.P([[455, 380], [585, 380], [560, 300], [480, 300]]), '#1d1a22', { seed: 71, sh: 1 });
      CD.cut(CD.E(520, 384, 34, 16), '#fff2c4', { seed: 72, sh: 0, edge: false });
      CD.glow(520, 400, 260, 'rgba(255,226,170,0.9)', 0.5 + lit * 0.4);
    });
    // empresário
    const ox = o.ownerX ?? 520;
    CD.layer(0.92, () => { CD.owner(ox, 1190, 1, o.owner || {}); });
    // balcão + telefone
    CD.layer(1, () => {
      CD.cut(CD.R(-300, 1360, 1700, 800), C.floor, { sh: 0, amp: 0, seed: 80, grain: 0.5 });
      for (let i = 0; i < 6; i++) CD.stroke([[-300, 1420 + i * 90], [1400, 1420 + i * 90]], 'rgba(0,0,0,0.25)', 3, 81 + i);
      CD.cut(CD.R(100, 1200, 880, 400), C.card, { seed: 90, sh: 1.4 });
      for (let i = 0; i < 22; i++) CD.cut(CD.R(118 + i * 40, 1215, 9, 370), C.cardD, { seed: 91 + i, sh: 0, amp: 1, grain: 0, edge: false, alpha: 0.45 });
      CD.cut(CD.R(70, 1160, 940, 54, 4), C.cardL, { seed: 120, sh: 1.2 });
      CD.cut(CD.R(390, 1300, 300, 120, 8), CD.lerpCol('#3a2c22', C.purpleD, lit), { seed: 121, sh: 0.6 });
      if (lit > 0.3) CD.text('BEM-VINDO', 540, 1362, { size: 48, color: C.white, alpha: CD.clamp((lit - 0.3) * 2) });
      CD.phoneBase(250, 1168, o.phoneShake || [0, 0]);
      const hs = o.handset;
      if (hs) { CD.cord([290, 1150], [hs.x + 60, hs.y + 10]); CD.handset(hs.x, hs.y, hs.rot); }
    });
    if (o.front) o.front();
  };
  // utilitários de cor
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  CD.lerpCol = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * CD.clamp(t))).join(',')})`; };
  CD.darken = (a, k) => { const A = hex(a); return '#' + A.map((v) => Math.round(v * k).toString(16).padStart(2, '0')).join(''); };
})(window.CD);
