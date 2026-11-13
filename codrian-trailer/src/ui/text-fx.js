import gsap from 'gsap';
import { mulberry32 } from '../core/math.js';

export const el = (tag, cls, html, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; };

/** Cria linhas de texto, cada uma com <span class="ch"> por caractere. Retorna {root, lines:[{el,chars}]} */
export function buildLines(parent, lines, { cls = 'h-xl', size = 120, width = 940, classes = [] } = {}) {
  const root = el('div', cls, null, parent); const out = [];
  lines.forEach((txt, i) => {
    const ln = el('div', 'ln ' + (classes[i] || ''), null, root); const chars = [];
    [...txt].forEach((c) => { const s = el('span', 'ch', c === ' ' ? '&nbsp;' : c, ln); chars.push(s); });
    ln.style.fontSize = size + 'px'; out.push({ el: ln, chars, txt });
  });
  const g = document.createElement('canvas').getContext('2d');
  out.forEach((l) => { // ajusta cada linha à largura alvo (estilo cartaz), medindo em canvas
    g.font = `900 100px "DM Sans"`; g.letterSpacing = '-2.5px'; const w100 = g.measureText(l.txt).width || 1;
    l.el.style.fontSize = Math.min(size * 1.7, (100 * width) / w100) + 'px';
  });
  return { root, lines: out };
}
/** Entrada "slam": escala grande + blur + deslocamento, assentando com easing expo. */
export function slamIn(tl, chars, at, { dur = 0.55, stagger = 0.02, from = 3.2, blur = 26, y = -60, rot = 0 } = {}) {
  tl.fromTo(chars, { scale: from, opacity: 0, filter: `blur(${blur}px)`, y, rotationX: 50, rotation: rot },
    { scale: 1, opacity: 1, filter: 'blur(0px)', y: 0, rotationX: 0, rotation: 0, duration: dur, ease: 'expo.out', stagger }, at);
}
/** Saída com blur/scale e leve ruído. */
export function slamOut(tl, chars, at, { dur = 0.4, stagger = 0.012, to = 1.7, blur = 22 } = {}) {
  tl.to(chars, { scale: to, opacity: 0, filter: `blur(${blur}px)`, y: 30, duration: dur, ease: 'power3.in', stagger }, at);
}
/** Glitch controlado: deslocamento RGB por clones coloridos em passos de 1/30s (determinístico). */
export function glitchBurst(tl, target, at, dur = 0.35, { seed = 3, amp = 26, colors = ['#8B6CFF', '#B7FF4A'] } = {}) {
  const rnd = mulberry32(seed), n = Math.round(dur * 30);
  const clones = colors.map((c) => { const k = target.cloneNode(true); k.style.cssText += `;position:absolute;inset:0;pointer-events:none;color:${c};mix-blend-mode:screen;opacity:0;text-shadow:none`; k.querySelectorAll('.ch').forEach((x) => (x.style.cssText = '')); k.classList.add('gclone'); return k; });
  clones.forEach((k) => target.parentNode.appendChild(k));
  for (let i = 0; i < n; i++) {
    const t = at + i / 30;
    clones.forEach((k, j) => {
      const dx = (rnd() - 0.5) * amp * (j ? -1 : 1), dy = (rnd() - 0.5) * amp * 0.25, a = rnd() * 28, b = a + 8 + rnd() * 30;
      tl.set(k, { x: dx, y: dy, opacity: 0.85, clipPath: `inset(${a}% 0 ${100 - b}% 0)` }, t);
    });
    tl.set(target, { x: (rnd() - 0.5) * amp * 0.4 }, t);
  }
  tl.set(clones, { opacity: 0 }, at + dur); tl.set(target, { x: 0 }, at + dur);
}
export const shakeEl = (tl, target, at, dur = 0.4, amp = 14, seed = 5) => {
  const rnd = mulberry32(seed), n = Math.round(dur * 30);
  for (let i = 0; i < n; i++) { const k = 1 - i / n; tl.set(target, { x: (rnd() - 0.5) * amp * k, y: (rnd() - 0.5) * amp * k, rotation: (rnd() - 0.5) * 1.2 * k }, at + i / 30); }
  tl.set(target, { x: 0, y: 0, rotation: 0 }, at + dur);
};
export const flash = (tl, at, { peak = 0.8, dur = 0.35, color = '#fff' } = {}) => {
  tl.set('#flash', { backgroundColor: color }, at).fromTo('#flash', { opacity: peak }, { opacity: 0, duration: dur, ease: 'power2.out' }, at);
};
