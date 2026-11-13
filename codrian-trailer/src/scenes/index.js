import { createS1 } from './s1-apocalypse.js';
// Os demais módulos são carregados em ordem; cada um exporta create(ctx) -> cena com {three, dom, tl, update, draw2d, post, transition}
export async function loadScenes(ctx) {
  const mods = [['./s1-apocalypse.js', 'createS1'], ['./s2-businessman.js', 'createS2'], ['./s3-competitor.js', 'createS3'], ['./s4-ai-awakens.js', 'createS4'], ['./s5-solution.js', 'createS5'], ['./s6-reveal.js', 'createS6']];
  const out = [];
  for (const [p, fn] of mods) { try { const m = await import(p); out.push(m[fn](ctx)); } catch (e) { if (/Failed to fetch|Cannot find|404|Unexpected token|error loading/i.test(String(e.message)) && !window.CODRIAN_STRICT) { console.warn('cena ausente', p, e.message); } else throw e; } }
  return out;
}
