// Camadas 2D: partículas, painéis holográficos, tipografia, legendas e logo (sem estado: tudo é função do tempo)
'use strict';
(function () {
const { W, H } = ENGINE;
const C = { void: '#100C1C', deep: '#271942', violet: '#6938E8', violetHi: '#8B6CFF', lime: '#B7FF4A', ink: '#F4F1FF', mist: '#CFC6EE', muted: '#8E83B8', crimson: '#FF2A3D' };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ss = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const outExpo = (k) => k >= 1 ? 1 : 1 - Math.pow(2, -10 * k);
const outCubic = (k) => 1 - Math.pow(1 - k, 3);
const inOut = (k) => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return (s % 1e6) / 1e6; }; }
const hash = (i) => { const r = rng(i * 9301 + 49297); r(); return r(); };

// sprites de brilho
const sprites = {};
function sprite(col) {
  if (sprites[col]) return sprites[col];
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.12, col); g.addColorStop(.4, col.replace(/[\d.]+\)$/, '0.25)')); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); sprites[col] = c; return c;
}
const COL = { crimson: 'rgba(255,60,50,1)', ember: 'rgba(255,130,60,1)', violet: 'rgba(139,108,255,1)', lime: 'rgba(183,255,74,1)', white: 'rgba(220,225,255,1)', dust: 'rgba(150,130,170,1)' };
function glow(ctx, x, y, r, col, a) { if (a <= 0.003 || r <= 0) return; ctx.globalAlpha = Math.min(a, 1); ctx.drawImage(sprite(col), x - r, y - r, r * 2, r * 2); }

// ---------- partículas ----------
function embers(ctx, t, o) {
  const n = o.n || 160, r = rng(o.seed || 7);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x0 = r() * W, y0 = r() * H, z = .3 + r() * 1.7, sp = (40 + r() * 120) * (o.speed || 1), ph = r() * 6.28, cc = r();
    const dir = o.dir || -1;
    let y = ((y0 + dir * t * sp / z) % (H + 300) + H + 300) % (H + 300) - 150;
    const x = x0 + Math.sin(t * (.6 + cc) + ph) * 30 / z + (o.wind || 0) * t * 60 / z;
    const fl = .55 + .45 * Math.sin(t * (5 + cc * 9) + ph * 3);
    const near = z < .55; // fora de foco: bokeh grande e fraco
    const size = near ? 34 / z : 9 / z;
    const a = (near ? .18 : .9) * fl * (o.alpha ?? 1);
    glow(ctx, ((x % W) + W) % W, y, size, cc > .7 ? COL.crimson : (o.col || COL.ember), a);
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
function dust(ctx, t, o) {
  const n = o.n || 90, r = rng(o.seed || 3);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x = r() * W + Math.sin(t * .3 + i) * 40, y = (r() * H + t * (8 + r() * 20)) % H, z = .5 + r();
    glow(ctx, x, y, 3 + 10 * (1.5 - z), o.col || COL.dust, .25 * (o.alpha ?? 1));
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
// destroços no espaço vindo em direção à câmera
function debris(ctx, t, o) {
  const n = o.n || 26, r = rng(o.seed || 11);
  for (let i = 0; i < n; i++) {
    const x = (r() - .5) * 14, y = (r() - .5) * 20, z0 = 2 + r() * 40, v = 6 + r() * 10, sz = .08 + r() * .35, rs = r() * 10, spin = (r() - .5) * 2;
    let z = z0 - t * v * (o.speed || 1); z = ((z % 42) + 42) % 42 + .3;
    const f = 900, sx = W / 2 + x / z * f + (o.ox || 0), sy = H * .45 + y / z * f, s = sz / z * f;
    if (s < 1.2 || s > 900 || sx < -s || sx > W + s || sy < -s || sy > H + s) continue;
    const rr = rng(Math.floor(rs * 1000)); const pts = []; const k = 7 + Math.floor(rr() * 4);
    for (let j = 0; j < k; j++) { const a = j / k * 6.283 + t * spin; const rad = s * (.6 + rr() * .5); pts.push([sx + Math.cos(a) * rad, sy + Math.sin(a) * rad * .85]); }
    ctx.beginPath(); pts.forEach((p, j) => j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
    const fade = clamp((40 - z) / 8) * clamp(z / 1.2);
    const g = ctx.createLinearGradient(sx - s, sy - s, sx + s, sy + s);
    g.addColorStop(0, `rgba(${o.rim || '170,60,70'},${.9 * fade})`); g.addColorStop(.35, `rgba(14,10,20,${fade})`); g.addColorStop(1, `rgba(5,4,8,${fade})`);
    ctx.fillStyle = g; ctx.fill();
    if (z < 3 && o.blur !== false) { /* perto: borrado pelo DOF natural do motion blur */ }
  }
}
// faíscas elétricas
function sparks(ctx, t, o) {
  const r = rng(o.seed || 5); const bursts = o.bursts || 14;
  ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (let b = 0; b < bursts; b++) {
    const tb = r() * (o.dur || 2), bx = (r() < .5 ? r() * .25 : .75 + r() * .25) * W, by = (.25 + r() * .5) * H;
    const dt = t - tb; const m = 26;
    for (let i = 0; i < m; i++) {
      const vx = (r() - .5) * 900, vy = -r() * 700 - 100, life = .35 + r() * .5;
      if (dt < 0 || dt > life) continue;
      const g = 2400, px = bx + vx * dt, py = by + vy * dt + .5 * g * dt * dt;
      const qx = bx + vx * (dt - .025), qy = by + vy * (dt - .025) + .5 * g * (dt - .025) ** 2;
      const a = 1 - dt / life;
      ctx.strokeStyle = `rgba(255,${180 + 60 * a | 0},${90 + 120 * a | 0},${a})`; ctx.lineWidth = 3.2 * a + .8;
      ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(px, py); ctx.stroke();
    }
    if (dt > 0 && dt < .12) glow(ctx, bx, by, 160, COL.ember, (1 - dt / .12));
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
// rede de nós 3D (grafismo da marca) com onda de ativação
const NET = (() => {
  const r = rng(42), N = 460, nodes = [];
  for (let i = 0; i < N; i++) nodes.push({ x: (r() - .5) * 16, y: (r() - .5) * 26, z: r() * 70, lime: r() < .07, ph: r() * 6.28 });
  const edges = [];
  for (let i = 0; i < N; i++) { let k = 0;
    for (let j = i + 1; j < N && k < 3; j++) { const a = nodes[i], b = nodes[j]; const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z); if (d < 3.4) { edges.push([i, j, d]); k++; } } }
  return { nodes, edges };
})();
function network(ctx, t, o) {
  const camZ = -6 + t * (o.speed ?? 5), F = 1000, R = (o.wave ?? t * 16), cx = W / 2 + (o.ox || 0), cy = H * .5;
  const P = NET.nodes.map(n => { const z = n.z - camZ; if (z < .4) return null;
    const d = Math.hypot(n.x, n.y, n.z - (o.origin ?? 8)); const on = clamp((R - d) / 2.5); const front = Math.exp(-((R - d) ** 2) / 3);
    return { x: cx + n.x / z * F, y: cy + n.y / z * F, z, on, front, lime: n.lime, ph: n.ph }; });
  ctx.globalCompositeOperation = 'lighter';
  for (const [i, j] of NET.edges) { const a = P[i], b = P[j]; if (!a || !b) continue; const on = Math.min(a.on, b.on); if (on <= .01) continue;
    const fade = clamp((70 - a.z) / 30) * clamp(a.z / 3);
    ctx.strokeStyle = `rgba(139,108,255,${.55 * on * fade * (o.alpha ?? 1)})`; ctx.lineWidth = Math.max(.6, 3 / a.z * 2.2);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
  for (const p of P) { if (!p) continue; const fade = clamp((70 - p.z) / 30) * clamp(p.z / 2);
    const s = (p.z < 2.5 ? 70 : 26) / p.z * 3; const a = (p.on * .8 + p.front * 1.5) * fade * (o.alpha ?? 1) * (p.z < 2.5 ? .35 : 1);
    glow(ctx, p.x, p.y, s, p.lime && p.on > .5 ? COL.lime : COL.violet, a); }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
// anel de ping / onda
function ring(ctx, x, y, r, col, a, w) { if (a <= 0) return; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = w || 3; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
// reflexo anamórfico
function flare(ctx, x, y, a, col) { if (a <= 0) return; ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(x - W, y, x + W, y); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, col || 'rgba(160,140,255,.9)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(x - W, y - 3, W * 2, 6); ctx.globalAlpha = a * .4; ctx.fillRect(x - W, y - 14, W * 2, 28);
  glow(ctx, x, y, 220, COL.white, a * .8); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }

// ---------- tipografia ----------
const F = (w, s) => `${w} ${s}px "DM Sans", system-ui, sans-serif`;
function text(ctx, str, x, y, o = {}) {
  ctx.save(); ctx.font = F(o.w || 700, o.size || 64); ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'alphabetic';
  if (o.ls != null) ctx.letterSpacing = o.ls + 'px';
  ctx.globalAlpha = o.a ?? 1; if (o.blur) ctx.filter = `blur(${o.blur}px)`;
  ctx.fillStyle = o.col || C.ink; if (o.scale) { ctx.translate(x, y); ctx.scale(o.scale, o.scale); ctx.fillText(str, 0, 0); } else ctx.fillText(str, x, y);
  ctx.restore();
}
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

// ---------- painéis holográficos (painéis em fio da marca: linha 1,5px + detalhe lima) ----------
function panelFrame(ctx, x, y, w, h, a, opts = {}) {
  ctx.save(); ctx.globalAlpha = a;
  rrect(ctx, x, y, w, h, 22); ctx.fillStyle = opts.fill || 'rgba(39,25,66,.55)'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = opts.stroke || 'rgba(139,108,255,.95)'; ctx.stroke();
  // barra superior
  ctx.fillStyle = opts.stroke || 'rgba(139,108,255,.95)';
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x + 34 + i * 26, y + 34, 7, 0, 6.283); ctx.globalAlpha = a * (i ? .5 : 1); ctx.fill(); }
  ctx.globalAlpha = a; ctx.fillRect(x, y + 66, w, 2);
  ctx.restore();
}
function panelSite(ctx, x, y, w, h, prog, a, name) {
  panelFrame(ctx, x, y, w, h, a);
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y);
  const k = (i) => clamp((prog - i * .1) / .18);
  ctx.strokeStyle = 'rgba(139,108,255,.9)'; ctx.lineWidth = 3;
  // barra de endereço
  ctx.globalAlpha = a * k(0); rrect(ctx, 120, 18, w - 160, 32, 16); ctx.stroke();
  // título da empresa
  ctx.globalAlpha = a * k(1); ctx.fillStyle = C.ink; ctx.font = F(700, 56); ctx.textAlign = 'left';
  ctx.fillText(name.slice(0, Math.round(name.length * k(1))), 44, 160);
  ctx.globalAlpha = a * k(2); ctx.fillStyle = C.mist; ctx.font = F(500, 30); ctx.fillText('Aberto agora · 4,9 ★', 44, 208);
  // bloco de imagem
  ctx.globalAlpha = a * k(3); rrect(ctx, 44, 240, w - 88, (h - 470) * k(3), 18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(44, 240); ctx.lineTo(w - 44, 240 + (h - 470) * k(3)); ctx.globalAlpha = a * k(3) * .35; ctx.stroke();
  // botão WhatsApp (detalhe lima)
  ctx.globalAlpha = a * k(5); rrect(ctx, 44, h - 200, w - 88, 92, 46); ctx.fillStyle = C.violet; ctx.fill();
  ctx.fillStyle = C.ink; ctx.font = F(700, 36); ctx.textAlign = 'center'; ctx.fillText('Chame no WhatsApp', w / 2, h - 141);
  ctx.globalAlpha = a * k(6); ctx.fillStyle = C.lime; ctx.beginPath(); ctx.arc(w - 64, 160 - 18, 9, 0, 6.283); ctx.fill();
  ctx.restore();
}
function panelChat(ctx, x, y, w, h, prog, a) {
  panelFrame(ctx, x, y, w, h, a);
  ctx.save(); ctx.translate(x, y); ctx.textAlign = 'left';
  ctx.globalAlpha = a; ctx.fillStyle = C.ink; ctx.font = F(700, 34); ctx.fillText('IA da empresa', 120, 46);
  const msgs = [['in', 'Vocês abrem sábado?'], ['out', 'Abrimos sim, das 8h às 14h.'], ['out', 'Quer que eu mande o endereço?'], ['in', 'Quero! 🙌'.replace('🙌', '')]];
  let yy = 120;
  msgs.forEach((m, i) => {
    const k = clamp((prog - i * .22) / .12); if (k <= 0) return;
    ctx.font = F(500, 34); const tw = ctx.measureText(m[1]).width + 52; const bx = m[0] === 'in' ? 36 : w - 36 - tw;
    ctx.globalAlpha = a * k; rrect(ctx, bx, yy + (1 - k) * 20, tw, 74, 30);
    ctx.fillStyle = m[0] === 'in' ? 'rgba(244,241,255,.12)' : C.violet; ctx.fill();
    ctx.fillStyle = C.ink; ctx.fillText(m[1], bx + 26, yy + 48 + (1 - k) * 20); yy += 100;
  });
  // digitando
  const dots = clamp((prog - .88) / .05); if (dots > 0 && prog < 1) for (let i = 0; i < 3; i++) { ctx.globalAlpha = a * (.4 + .6 * Math.abs(Math.sin(prog * 30 + i))); ctx.fillStyle = C.mist; ctx.beginPath(); ctx.arc(w - 120 + i * 24, yy + 30, 7, 0, 6.283); ctx.fill(); }
  ctx.restore();
}
function panelFlow(ctx, x, y, w, h, prog, a) {
  panelFrame(ctx, x, y, w, h, a);
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha = a; ctx.textAlign = 'center';
  ctx.fillStyle = C.ink; ctx.font = F(700, 34); ctx.textAlign = 'left'; ctx.fillText('Automação', 120, 46); ctx.textAlign = 'center';
  const steps = ['Mensagem recebida', 'IA responde', 'Cliente atendido'];
  steps.forEach((s, i) => {
    const k = clamp((prog - i * .28) / .15); const yy = 130 + i * ((h - 220) / 2.4);
    ctx.globalAlpha = a * k; rrect(ctx, 60, yy, w - 120, 96, 24); ctx.strokeStyle = 'rgba(139,108,255,.95)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = i === 2 ? 'rgba(105,56,232,.65)' : 'rgba(39,25,66,.7)'; ctx.fill();
    ctx.fillStyle = C.ink; ctx.font = F(700, 38); ctx.fillText(s, w / 2, yy + 61);
    if (i < 2) { const kk = clamp((prog - i * .28 - .15) / .13); ctx.globalAlpha = a * kk; ctx.fillStyle = C.violetHi; ctx.fillRect(w / 2 - 2, yy + 96, 4, ((h - 220) / 2.4 - 96) * kk); }
  });
  ctx.restore();
}
function panelMap(ctx, x, y, w, h, prog, a, mode) {
  // mode 'vanish': pinos desaparecem; 'ping': ping lima no centro
  ctx.save(); ctx.globalAlpha = a; rrect(ctx, x, y, w, h, 24); ctx.clip();
  ctx.fillStyle = 'rgba(16,12,28,.85)'; ctx.fillRect(x, y, w, h);
  const r = rng(77); ctx.strokeStyle = 'rgba(139,108,255,.22)'; ctx.lineWidth = 3;
  for (let i = 0; i < 16; i++) { ctx.beginPath(); const xx = x + r() * w; ctx.moveTo(xx, y); ctx.lineTo(xx + (r() - .5) * 300, y + h); ctx.stroke(); }
  for (let i = 0; i < 20; i++) { ctx.beginPath(); const yy = y + r() * h; ctx.moveTo(x, yy); ctx.lineTo(x + w, yy + (r() - .5) * 200); ctx.stroke(); }
  ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(139,108,255,.35)'; ctx.beginPath(); ctx.moveTo(x, y + h * .7); ctx.bezierCurveTo(x + w * .3, y + h * .5, x + w * .6, y + h * .9, x + w, y + h * .35); ctx.stroke();
  if (mode === 'vanish') {
    const n = 24, rr = rng(91);
    for (let i = 0; i < n; i++) {
      const px = x + 60 + rr() * (w - 120), py = y + 80 + rr() * (h - 160), die = rr();
      const k = prog - die * .85; const alive = k < 0 ? 1 : (k < .06 ? (Math.floor(k * 400) % 2) : 0);
      if (!alive) { ctx.globalAlpha = a * .5 * clamp(1 - (k - .06) * 4); ctx.strokeStyle = C.crimson; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px - 12, py - 12); ctx.lineTo(px + 12, py + 12); ctx.moveTo(px + 12, py - 12); ctx.lineTo(px - 12, py + 12); ctx.stroke(); continue; }
      ctx.globalAlpha = a; ctx.fillStyle = '#F4F1FF'; ctx.beginPath(); ctx.arc(px, py - 22, 16, Math.PI * .85, Math.PI * 2.15); ctx.lineTo(px, py); ctx.closePath(); ctx.fill();
      ctx.fillStyle = C.void; ctx.beginPath(); ctx.arc(px, py - 22, 6, 0, 6.283); ctx.fill();
    }
  }
  ctx.restore();
}
function panel404(ctx, x, y, w, h, a, t) {
  panelFrame(ctx, x, y, w, h, a, { stroke: 'rgba(255,42,61,.95)', fill: 'rgba(30,6,12,.6)' });
  ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center';
  ctx.fillStyle = C.crimson; ctx.font = F(700, 230); ctx.fillText('404', x + w / 2, y + h * .52);
  ctx.fillStyle = C.ink; ctx.font = F(700, 50); ctx.fillText('Empresa não encontrada.', x + w / 2, y + h * .52 + 100);
  ctx.fillStyle = C.mist; ctx.font = F(500, 32); ctx.fillText('Nenhum resultado para a sua busca.', x + w / 2, y + h * .52 + 160);
  ctx.restore();
}
function panelOffline(ctx, x, y, w, h, a, t, prog) {
  panelFrame(ctx, x, y, w, h, a, { stroke: 'rgba(255,42,61,.9)', fill: 'rgba(30,6,12,.55)' });
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y);
  ctx.fillStyle = C.crimson; ctx.font = F(700, 40); ctx.textAlign = 'left'; ctx.fillText('SISTEMA OFFLINE', 120, 46);
  // gráfico despencando
  ctx.strokeStyle = C.crimson; ctx.lineWidth = 5; ctx.beginPath();
  for (let i = 0; i <= 40; i++) { const k = i / 40; const v = .3 + .25 * Math.sin(k * 9) * (1 - k) + .35 * (1 - ss(.45, .9, k + (1 - prog) * .5)); const px = 40 + k * (w - 80), py = h - 50 - v * (h - 160); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.stroke(); ctx.restore();
}

// ---------- logo oficial (geometria exata do SVG negativo, dividida por letra) ----------
const LOGO = (() => {
  const d = DATA.logo.d; const subs = d.match(/M[^M]+/g);
  const letters = [[50, 560], [610, 1125], [1175, 1720], [1800, 2125], [2150, 2325], [2380, 2860], [2935, 3430]];
  const groups = letters.map(() => []);
  subs.forEach(s => { const xs = [...s.matchAll(/(-?[\d.]+)\s+(-?[\d.]+)/g)].map(m => +m[1]); const mn = Math.min(...xs);
    const gi = letters.findIndex(([a, b]) => mn >= a - 5 && mn <= b); groups[gi].push(s); });
  const paths = groups.map(g => new Path2D(g.join(' ')));
  const [cx, cy, r, fill] = DATA.logo.dot; return { paths, dot: { cx: +cx, cy: +cy, r: +r, fill }, letters, width: 3743 };
})();
// coordenadas: unidades do SVG (em = 1000). Retorna posição do ponto em px.
function logoLayout(scale) { const ox = W / 2 - 1896.5 * scale; const oy = 860; return { ox, oy, s: scale, dot: [ox + LOGO.dot.cx * scale, oy + LOGO.dot.cy * scale] }; }
// tl = tempo desde o impacto (s); motion da marca: letras da direita p/ esquerda, 85ms, 950ms, out-expo, 0,5em/0,1em, blur 14px
function drawLogo(ctx, tl, scale) {
  const L = logoLayout(scale), em = 1000 * scale;
  for (let i = 6; i >= 0; i--) {
    const order = 6 - i; const k = clamp((tl - order * .085) / .95); if (k <= 0) continue; const e = outExpo(k);
    ctx.save(); ctx.globalAlpha = clamp(k * 1.6);
    const bl = 14 * (1 - e); if (bl > .3) ctx.filter = `blur(${bl.toFixed(1)}px)`;
    ctx.translate(L.ox + .5 * em * (1 - e), L.oy + .1 * em * (1 - e)); ctx.scale(scale, scale);
    ctx.fillStyle = C.ink; ctx.fill(LOGO.paths[i]); ctx.restore();
  }
  return L;
}
function drawDot(ctx, L, scaleK) { ctx.save(); ctx.fillStyle = C.lime; ctx.beginPath(); ctx.arc(L.dot[0], L.dot[1], LOGO.dot.r * L.s * scaleK, 0, 6.283); ctx.fill(); ctx.restore(); }

// ---------- legendas sincronizadas palavra a palavra ----------
function subtitles(ctx, t) {
  const s = DATA.subs.find(s => t >= s.start && t < s.end); if (!s) return;
  const a = clamp((t - s.start) / .12) * clamp((s.end - t) / .15);
  ctx.save(); ctx.font = F(700, 54); ctx.textBaseline = 'alphabetic';
  const maxW = 820, lh = 68; const lines = [[]]; let lw = 0; const sp = ctx.measureText(' ').width;
  s.words.forEach(w => { const ww = ctx.measureText(w[0]).width; if (lw + ww > maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; } lines[lines.length - 1].push([...w, ww]); lw += ww + sp; });
  const y0 = 1215 - (lines.length - 1) * lh / 2;
  lines.forEach((ln, li) => {
    const tw = ln.reduce((q, w) => q + w[3], 0) + sp * (ln.length - 1); let x = W / 2 - tw / 2;
    ln.forEach(w => {
      const k = clamp((t - w[1] + .06) / .14);
      ctx.globalAlpha = a * (.32 + .68 * k);
      ctx.shadowColor = 'rgba(8,4,16,.9)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 3;
      ctx.fillStyle = C.ink; ctx.fillText(w[0], x, y0 + li * lh + (1 - outCubic(k)) * 8);
      ctx.shadowBlur = 6; ctx.fillText(w[0], x, y0 + li * lh + (1 - outCubic(k)) * 8);
      x += w[3] + sp;
    });
  });
  ctx.restore();
}

window.FX = { C, COL, clamp, lerp, ss, outExpo, outCubic, inOut, rng, hash, glow, embers, dust, debris, sparks, network, ring, flare, text, F, rrect,
  panelFrame, panelSite, panelChat, panelFlow, panelMap, panel404, panelOffline, LOGO, logoLayout, drawLogo, drawDot, subtitles };
})();
