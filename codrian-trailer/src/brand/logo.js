// Logotipo Codrian reconstruído pela especificação do brand book (Pacote do Yan, seção 3):
// palavra "codrian" minúscula, DM Sans 700, tracking -0.045em, ponto lima de 0.2em na linha de base. Sem caixa alta, sem sombra, sem contorno.
// Se o vetor oficial for colocado em assets/brand/logo.svg, basta trocar drawLogo por drawImage (ver README).
import { BRAND } from '../config.js';

export function measureLogo(size) {
  const c = document.createElement('canvas').getContext('2d');
  c.font = `700 ${size}px "DM Sans"`; c.letterSpacing = `${-0.045 * size}px`;
  const w = c.measureText('codrian').width; const m = c.measureText('codrian');
  return { w, dot: 0.2 * size, total: w + 0.2 * size * 1.0 + 0.045 * size, asc: m.actualBoundingBoxAscent, desc: m.actualBoundingBoxDescent };
}
/** Desenha o logo com a base de texto em (x, baseY). */
export function drawLogo(g, x, baseY, size, { ink = BRAND.ink, dot = BRAND.lime, dotOnly = false, textOnly = false } = {}) {
  g.save(); g.font = `700 ${size}px "DM Sans"`; g.letterSpacing = `${-0.045 * size}px`; g.textBaseline = 'alphabetic';
  const w = g.measureText('codrian').width;
  if (!dotOnly) { g.fillStyle = ink; g.fillText('codrian', x, baseY); }
  if (!textOnly) { const d = 0.2 * size; g.fillStyle = dot; g.beginPath(); g.arc(x + w + d * 0.62, baseY - d / 2, d / 2, 0, Math.PI * 2); g.fill(); }
  g.restore();
}
export function logoCanvas(size = 320, opts = {}) {
  const m = measureLogo(size), pad = size * 0.3, c = document.createElement('canvas');
  c.width = Math.ceil(m.total + pad * 2); c.height = Math.ceil(size * 1.1 + pad * 2);
  drawLogo(c.getContext('2d'), pad, pad + size * 0.82, size, opts); return c;
}
/** Amostra pontos (em unidades de mundo, centrados) onde o canvas tem alfa, para as partículas formarem o logo. */
export function sampleTargets(canvas, worldWidth, maxPts = 14000, step = 2) {
  const g = canvas.getContext('2d'), { width: w, height: h } = canvas, d = g.getImageData(0, 0, w, h).data, pts = [];
  for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) if (d[(y * w + x) * 4 + 3] > 140) pts.push([x, y]);
  const k = worldWidth / w, out = new Float32Array(Math.min(pts.length, maxPts) * 3), n = out.length / 3, skip = pts.length / n;
  for (let i = 0; i < n; i++) { const [x, y] = pts[Math.floor(i * skip)]; out.set([(x - w / 2) * k, -(y - h / 2) * k, 0], i * 3); }
  return out;
}
