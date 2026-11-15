// Lê os timestamps do ElevenLabs e gera src/data/cues.js:
//  - início/fim real de cada fala no vídeo
//  - legendas em blocos curtos (2–4 palavras) com tempo de cada palavra
import fs from 'node:fs';
import path from 'node:path';
import { FALAS, LEGENDA_OVERRIDE, DURACAO } from './roteiro.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const r3 = n => Math.round(n * 1000) / 1000;

function words(al) {
  const out = []; let cur = null;
  al.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) { if (cur) out.push(cur); cur = null; return; }
    if (!cur) cur = { w: '', s: al.character_start_times_seconds[i] };
    cur.w += ch; cur.e = al.character_end_times_seconds[i];
  });
  if (cur) out.push(cur);
  return out;
}

const cues = {}; const caps = [];
for (const f of FALAS) {
  const al = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/audio/vo', `${f.cue}.json`)));
  let ws = words(al).map(w => ({ w: w.w, s: r3(f.at + w.s), e: r3(f.at + w.e) }));
  // substitui sequências faladas por texto de legenda (ex.: "zero quarenta e sete." → "047.")
  for (const [spoken, shown] of Object.entries(LEGENDA_OVERRIDE[f.cue] || {})) {
    const sp = spoken.split(' ');
    for (let i = 0; i + sp.length <= ws.length; i++) {
      if (sp.every((t, j) => ws[i + j].w.toLowerCase() === t)) {
        ws.splice(i, sp.length, { w: shown, s: ws[i].s, e: ws[i + sp.length - 1].e });
      }
    }
  }
  cues[f.cue] = { start: r3(f.at), end: ws.at(-1).e, voz: f.voz, words: ws };
  // agrupa: quebra em pontuação forte ou a cada ~16 caracteres
  let chunk = [];
  const flush = () => { if (chunk.length) caps.push({ voz: f.voz, s: chunk[0].s, e: chunk.at(-1).e, words: chunk }); chunk = []; };
  ws.forEach((w, i) => {
    // quebra antes de "sem"/"pro" para manter a frase legível
    if (chunk.length >= 2 && /^(sem|pro)$/i.test(w.w)) flush();
    chunk.push(w);
    const len = chunk.map(c => c.w).join(' ').length;
    if (/[.!?…]$/.test(w.w) || (/,$/.test(w.w) && len > 8) || (len >= 16 && !/^(sem|pro)$/i.test(ws[i + 1]?.w || ''))) flush();
  });
  flush();
}
// cada legenda fica até a próxima começar (máx. +0.5s após a fala)
caps.forEach((c, i) => { const nx = caps[i + 1]; c.out = r3(Math.min(nx ? nx.s - 0.02 : DURACAO, c.e + 0.5)); });

fs.mkdirSync(path.join(ROOT, 'src/data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'src/data/cues.js'),
  `// GERADO por scripts/build-cues.mjs — não editar à mão\nwindow.DURACAO = ${DURACAO};\nwindow.CUES = ${JSON.stringify(cues)};\nwindow.CAPTIONS = ${JSON.stringify(caps)};\n`);
console.log(caps.map(c => `${c.s.toFixed(2)} ${c.words.map(w => w.w).join(' ')}`).join('\n'));
