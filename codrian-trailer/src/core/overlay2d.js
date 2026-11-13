import { mulberry32 } from './math.js';
// Canvas 2D complementar: relâmpagos tecnológicos, HUD, chuva digital. Tudo função pura do tempo (determinístico).
export class Overlay2D {
  constructor(canvas, W, H) { this.c = canvas; this.W = W; this.H = H; canvas.width = W; canvas.height = H; this.ctx = canvas.getContext('2d'); }
  clear() { this.ctx.clearRect(0, 0, this.W, this.H); }
}
export function bolt(ctx, x0, y0, x1, y1, seed, { color = '#8B6CFF', core = '#ffffff', width = 3, jag = 0.12, branches = 2, glow = 24 } = {}) {
  const rnd = mulberry32(seed);
  const pts = [[x0, y0]];
  const segs = 14, dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
  for (let i = 1; i < segs; i++) {
    const t = i / segs, o = (rnd() - 0.5) * len * jag * Math.sin(t * Math.PI);
    pts.push([x0 + dx * t + nx * o, y0 + dy * t + ny * o]);
  }
  pts.push([x1, y1]);
  const path = (p) => { ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]); };
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.globalCompositeOperation = 'lighter';
  ctx.shadowColor = color; ctx.shadowBlur = glow; ctx.strokeStyle = color; ctx.lineWidth = width * 2.2; path(pts); ctx.stroke();
  ctx.shadowBlur = 6; ctx.strokeStyle = core; ctx.lineWidth = width * 0.8; path(pts); ctx.stroke();
  for (let b = 0; b < branches; b++) {
    const k = 2 + Math.floor(rnd() * (segs - 4)), [sx, sy] = pts[k], ang = Math.atan2(dy, dx) + (rnd() - 0.5) * 1.6, bl = len * (0.1 + rnd() * 0.18);
    const bp = [[sx, sy]]; for (let i = 1; i <= 6; i++) { const a = ang + (rnd() - 0.5) * 0.7; const [px, py] = bp[i - 1]; bp.push([px + Math.cos(a) * bl / 6, py + Math.sin(a) * bl / 6]); }
    ctx.shadowBlur = glow * 0.6; ctx.strokeStyle = color; ctx.lineWidth = width * 0.9; path(bp); ctx.stroke();
  }
  ctx.restore();
}
export function glowLine(ctx, x0, y0, x1, y1, color, w = 2, blur = 16) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.shadowColor = color; ctx.shadowBlur = blur; ctx.strokeStyle = color; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.restore();
}
