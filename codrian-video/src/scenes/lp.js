// Landing page de papel (cena 4 monta peça a peça; cenas 2 e 5 usam a versão pronta).
// Coordenadas locais: 860 x 1250.
(function (CD) {
  const C = CD.C;
  CD.LP_W = 860; CD.LP_H = 1250;
  CD.buildLP = (K) => {
    CD.LP_PIECES = [
      { id: 'base', t: 16.45 }, { id: 'nav', t: 16.95 },
      { id: 'hero', t: K.pagina }, { id: 'title', t: K.pagina + 0.22 },
      { id: 'heroimg', t: K.apresenta }, { id: 'herotxt', t: K.apresenta + 0.25 }, { id: 'herobtn', t: K.apresenta + 0.5 },
      { id: 'svtitle', t: K.valoriza }, { id: 'sv1', t: K.servicos }, { id: 'sv2', t: K.servicos + 0.2 }, { id: 'sv3', t: K.servicos + 0.4 },
      { id: 'contact', t: K.transforma }, { id: 'cta', t: K.oport - 0.45 },
    ];
    CD.LP_PIECES.forEach((p, i) => { p.dx = CD.rs(i, 11) * 900; p.dy = (CD.rnd(i, 12) > 0.5 ? 1 : -1) * (700 + CD.rnd(i, 13) * 500); p.rot = CD.rs(i, 14) * 1.3; });
  };
  const parts = {
    base: () => { CD.cut(CD.R(0, 0, 860, 1250, 26), '#f4f1ea', { seed: 201, sh: 2 }); },
    nav: () => {
      CD.cut(CD.R(0, 0, 860, 96, 0), '#17121f', { seed: 202, sh: 0.6 });
      CD.cut(CD.E(58, 48, 22, 22), C.green, { seed: 203, sh: 0.3 });
      CD.text('SUA EMPRESA', 92, 50, { size: 38, align: 'left', shadow: false });
      for (let i = 0; i < 3; i++) CD.cut(CD.R(500 + i * 70, 42, 52, 10, 5), '#8b84a0', { seed: 204 + i, sh: 0, amp: 1 });
      CD.cut(CD.R(718, 26, 116, 46, 23), C.green, { seed: 208, sh: 0.4 }); CD.text('CONTATO', 776, 50, { size: 19, fam: 'Inter', weight: '800', color: C.ink, shadow: false });
    },
    hero: () => { CD.cut(CD.R(0, 96, 860, 470), C.purpleDD, { seed: 210, sh: 0.6 }); CD.glow(250, 300, 380, 'rgba(123,63,228,0.9)', 0.6); },
    title: () => {
      CD.text('FEITO COM', 44, 178, { size: 74, align: 'left' });
      CD.text('CUIDADO,', 44, 258, { size: 74, align: 'left' });
      CD.text('PERTO DE VOCÊ.', 44, 338, { size: 74, align: 'left', color: C.green });
    },
    herotxt: () => { CD.cut(CD.R(44, 392, 400, 14, 7), '#a596d6', { seed: 211, sh: 0, amp: 1 }); CD.cut(CD.R(44, 420, 330, 14, 7), '#a596d6', { seed: 212, sh: 0, amp: 1 }); },
    herobtn: () => { CD.cut(CD.R(44, 460, 300, 70, 35), C.green, { seed: 213, sh: 0.8 }); CD.text('PEDIR ORÇAMENTO', 194, 496, { size: 24, fam: 'Inter', weight: '800', color: C.ink, shadow: false }); },
    heroimg: () => { // fachada ilustrada
      CD.cut(CD.R(560, 170, 260, 340, 10), '#3b2470', { seed: 214, sh: 0.8 });
      CD.cut(CD.R(580, 290, 220, 220), '#e9dfc8', { seed: 215, sh: 0.4 });
      for (let i = 0; i < 5; i++) CD.cut(CD.P([[580 + i * 44, 240], [624 + i * 44, 240], [624 + i * 44, 290], [602 + i * 44, 306], [580 + i * 44, 290]]), i % 2 ? C.white : C.purple, { seed: 216 + i, sh: 0.4 });
      CD.cut(CD.R(600, 330, 90, 80, 4), '#9fd8ff', { seed: 222, sh: 0.2 }); CD.cut(CD.R(710, 340, 70, 170, 4), C.green, { seed: 223, sh: 0.3 });
      CD.cut(CD.R(588, 190, 204, 40, 6), C.ink, { seed: 224, sh: 0.3 }); CD.text('LOJA', 690, 211, { size: 28, shadow: false });
    },
    svtitle: () => { CD.text('NOSSOS SERVIÇOS', 430, 630, { size: 52, color: C.ink, shadow: false }); CD.cut(CD.R(370, 666, 120, 8, 4), C.purple, { seed: 225, sh: 0 }); },
    contact: () => {
      CD.text('CONTATO', 430, 1010, { size: 40, color: C.ink, shadow: false });
      [['phone', 90], ['pin', 360], ['clock', 630]].forEach(([k, x], i) => { CD.icon(k, x, 1080, 30, C.purple); CD.cut(CD.R(x + 44, 1066, 140, 12, 6), '#9a93a8', { seed: 230 + i, sh: 0, amp: 1 }); CD.cut(CD.R(x + 44, 1088, 100, 10, 5), '#c2bccb', { seed: 233 + i, sh: 0, amp: 1 }); });
    },
    cta: () => { CD.cut(CD.R(50, 1130, 760, 96, 48), C.green, { seed: 240, sh: 1.2 }); CD.text('FALE CONOSCO NO WHATSAPP', 430, 1179, { size: 32, fam: 'Inter', weight: '800', color: C.ink, shadow: false }); },
  };
  const card = (i, icon, name) => () => {
    const x = 30 + i * 275; CD.cut(CD.R(x, 700, 250, 270, 18), '#fffdf8', { seed: 250 + i, sh: 1 });
    CD.icon(icon, x + 125, 775, 44, i === 1 ? C.greenD : C.purple);
    CD.text(name, x + 125, 862, { size: 25, fam: 'Inter', weight: '800', color: C.ink, shadow: false });
    CD.cut(CD.R(x + 35, 895, 180, 11, 5), '#b9b2c6', { seed: 254 + i, sh: 0, amp: 1 }); CD.cut(CD.R(x + 55, 917, 140, 11, 5), '#d3cdda', { seed: 257 + i, sh: 0, amp: 1 });
  };
  parts.sv1 = card(0, 'star', 'QUALIDADE'); parts.sv2 = card(1, 'check', 'AGILIDADE'); parts.sv3 = card(2, 'chat', 'ATENDIMENTO');

  // desenha a LP centrada em (x,y) com escala s. build(t) controla a montagem; sem t = pronta.
  CD.drawLP = (x, y, s, o = {}) => {
    const ctx = CD.ctx; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.translate(-430, -625);
    for (const p of CD.LP_PIECES) {
      let k = 1;
      if (o.t != null) { if (o.t < p.t) continue; k = CD.prog(o.t, p.t, p.t + 0.38); }
      const e = CD.ease.back(k), m = 1 - e;
      ctx.save();
      if (m !== 0) { ctx.translate(430 + p.dx * m, 625 + p.dy * m); ctx.rotate(p.rot * m); ctx.scale(1 + 0.35 * m, 1 + 0.35 * m); ctx.translate(-430, -625); }
      if (p.id === 'cta' && o.press) { ctx.translate(430, 1178); ctx.scale(o.press, o.press); ctx.translate(-430, -1178); }
      parts[p.id]();
      ctx.restore();
    }
    ctx.restore();
  };
})(window.CD);
