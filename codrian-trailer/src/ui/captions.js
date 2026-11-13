import { VO } from '../config.js';
// Legendas palavra-por-palavra sincronizadas à locução (distribuição por peso de caracteres dentro da região de fala medida na envoltória).
const LINES = {
  s2: { text: 'Mas eu estava no almoço!', cls: '' },
  s3: { text: 'Mais um cliente conquistado.', cls: 's' },
  s5: { text: 'Sites, automações, inteligência artificial e soluções tecnológicas para transformar a maneira como sua empresa trabalha.', cls: 's', chunk: 4 },
  s6a: { text: 'CODRIAN. A tecnologia trabalhando a favor do seu negócio.', cls: 's', chunk: 4 }
};
export function speechRegion(env, thr = 0.08) {
  const r = env.rms; let a = r.findIndex((v) => v > thr), b = r.length - 1 - [...r].reverse().findIndex((v) => v > thr);
  return [Math.max(a, 0) / env.fps, (b + 1) / env.fps];
}
export function wordTimings(text, env, at) {
  const words = text.split(/\s+/), [s0, s1] = speechRegion(env);
  const weights = words.map((w) => w.replace(/[^\p{L}\d]/gu, '').length + 1.5 + (/[.,!?]$/.test(w) ? 2.5 : 0));
  const tot = weights.reduce((a, b) => a + b, 0); let acc = 0;
  return words.map((w, i) => { const t0 = at + s0 + ((s1 - s0) * acc) / tot; acc += weights[i]; return { w, t0, t1: at + s0 + ((s1 - s0) * acc) / tot }; });
}
export function buildCaptions(master, host, envelopes) {
  Object.entries(LINES).forEach(([k, def]) => {
    const vo = VO[k], env = envelopes[vo.file]; if (!env) return;
    const words = wordTimings(def.text, env, vo.at);
    const chunk = def.chunk || 99, groups = []; for (let i = 0; i < words.length; i += chunk) groups.push(words.slice(i, i + chunk));
    groups.forEach((g) => {
      const box = document.createElement('div'); box.className = 'cap ' + def.cls; host.appendChild(box);
      const spans = g.map((x) => { const s = document.createElement('span'); s.className = 'w'; s.textContent = x.w; box.appendChild(s); return s; });
      const start = g[0].t0 - 0.05, end = g[g.length - 1].t1 + 0.18;
      master.set(box, { display: 'flex' }, start).set(box, { display: 'none' }, end);
      master.fromTo(box, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.18, ease: 'power3.out' }, start);
      g.forEach((x, i) => {
        master.fromTo(spans[i], { opacity: 0.28, scale: 0.92, color: '#CFC6EE' }, { opacity: 1, scale: 1.08, color: '#ffffff', duration: 0.1, ease: 'back.out(3)' }, x.t0);
        master.to(spans[i], { scale: 1, color: '#B7FF4A', duration: 0.18, ease: 'power2.out' }, x.t0 + 0.1);
        master.to(spans[i], { color: '#F4F1FF', duration: 0.2 }, Math.max(x.t1, x.t0 + 0.3));
      });
    });
  });
}
