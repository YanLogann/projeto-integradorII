// Logotipo oficial Codrian desenhado a partir das curvas do brand book (src/brand/logo-paths.js). Sem redigitar o nome, sem sombra/contorno.
// Negativo (principal): letras ink, ponto lime.
import { BRAND } from '../config.js';
import { LOGO_VIEWBOX, LOGO_PATH, LOGO_DOT } from './logo-paths.js';

const [VX, , VW] = LOGO_VIEWBOX; const PATH = new Path2D(LOGO_PATH);
export function measureLogo(size) { const s = size / 1000; return { w: VW * s, dot: LOGO_DOT.r * 2 * s, total: VW * s }; }
/** Desenha o logo com a linha de base em baseY e a borda esquerda em x. size = 1em (em unidades de 1/1000). */
export function drawLogo(g, x, baseY, size, { ink = BRAND.ink, dot = BRAND.lime, dotOnly = false, textOnly = false } = {}) {
  const s = size / 1000; g.save(); g.translate(x - VX * s, baseY); g.scale(s, s);
  if (!dotOnly) { g.fillStyle = ink; g.fill(PATH); }
  if (!textOnly) { g.fillStyle = dot; g.beginPath(); g.arc(LOGO_DOT.cx, LOGO_DOT.cy, LOGO_DOT.r, 0, Math.PI * 2); g.fill(); }
  g.restore();
}
export function logoCanvas(size = 320, opts = {}) {
  const m = measureLogo(size), pad = size * 0.3, c = document.createElement('canvas');
  c.width = Math.ceil(m.total + pad * 2); c.height = Math.ceil(size * 1.05 + pad * 2);
  drawLogo(c.getContext('2d'), pad, pad + size * 0.8, size, opts); return c;
}
/** Amostra pontos (em unidades de mundo, centrados) onde o canvas tem alfa, para as partículas formarem o logo. */
export function sampleTargets(canvas, worldWidth, maxPts = 14000, step = 2) {
  const g = canvas.getContext('2d'), { width: w, height: h } = canvas, d = g.getImageData(0, 0, w, h).data, pts = [];
  for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) if (d[(y * w + x) * 4 + 3] > 140) pts.push([x, y]);
  const k = worldWidth / w, out = new Float32Array(Math.min(pts.length, maxPts) * 3), n = out.length / 3, skip = pts.length / n;
  for (let i = 0; i < n; i++) { const [x, y] = pts[Math.floor(i * skip)]; out.set([(x - w / 2) * k, -(y - h / 2) * k, 0], i * 3); }
  return out;
}
