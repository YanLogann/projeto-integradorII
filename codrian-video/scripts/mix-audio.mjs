// Mixagem: trilha (com ducking sob a voz) + vozes ElevenLabs + SFX sincronizados às palavras.
// Saída: out/audio-mix.wav (45s, -14 LUFS aprox.)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { FALAS, DURACAO } from './roteiro.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const A = p => path.join(ROOT, 'assets/audio', p);

// carrega os mesmos tempos que as cenas usam
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'src/data/cues.js'), 'utf8'), ctx);
const CUES = ctx.window.CUES;
const wt = (cue, m) => m ? CUES[cue].words.find(w => w.w.toLowerCase().includes(m.toLowerCase())).s : CUES[cue].start;

const tQ = wt('pista', 'Quatro'), tSaiu = wt('pista', 'saiu');
const tLP = wt('arma', 'Landing'), tWa = wt('lp', 'WhatsApp');
const ent = CUES.entregue.words;
const falha = k => ent.find(w => w.w.toLowerCase().startsWith(k)).s;

// [arquivo, tempo, volume]
const SFX = [
  ['sirene', 0.0, .45], ['impacto', 0.3, .9], ['glitch', 1.05, .35],
  ['whoosh', 4.35, .6], ['obturador', 4.6, .9], ['teclado', 5.0, .25], ['carimbo', wt('vitima', 'vítima') + .3, .9],
  ['whoosh', 7.85, .5], ['notif', wt('depoimento', 'direct'), .6], ['glitch', wt('depoimento', 'sumiu'), .3],
  ['whoosh', 10.85, .6], ['teclado', 11.25, .3], ['notif', wt('pista', 'Achou') + .45, .4],
  ...[0, 1, 2, 3].map(i => ['batida', tQ + i * (tSaiu - tQ) / 4, .8]),
  ['glitch', tSaiu, .6], ['carimbo', tSaiu + .2, .9],
  ['whoosh', 17.05, .6], ['carimbo', wt('concorrente', 'concorrente') + .5, .85],
  ['impacto', 21.2, 1], ['batida', 21.65, .9], ['batida', 22.5, .9], ['glitch', 23.85, .6],
  ['whoosh', 23.95, .6], ['impacto', falha('site'), .45], ['impacto', falha('prova'), .45], ['impacto', falha('caminho'), .5],
  ['riser', tLP - 4.0, .7], ['impacto', tLP, 1], ['glitch', tLP, .4],
  ['whoosh', wt('lp', 'Mostra') - .1, .45], ['whoosh', wt('lp', 'leva') - .1, .45], ['notif', tWa + .3, .8],
  ['whoosh', 37.1, .6], ['carimbo', wt('encerrado', 'encerrado') + .2, 1], ['impacto', wt('encerrado', 'CODRIAN'), .8],
  ['notif', wt('cta', 'Siga') + .95, .8],
];

const inputs = ['-i', A('music/trilha.mp3')];
const filters = [];
FALAS.forEach((f, i) => {
  inputs.push('-i', A(`vo/${f.cue}.mp3`));
  filters.push(`[${i + 1}:a]aresample=44100,adelay=${Math.round(f.at * 1000)}:all=1,volume=1.15[v${i}]`);
});
const base = FALAS.length + 1;
SFX.forEach(([name, t, vol], j) => {
  inputs.push('-i', A(`sfx/${name}.mp3`));
  filters.push(`[${base + j}:a]aresample=44100,adelay=${Math.max(0, Math.round(t * 1000))}:all=1,volume=${vol}[s${j}]`);
});
const vIn = FALAS.map((_, i) => `[v${i}]`).join('');
const sIn = SFX.map((_, j) => `[s${j}]`).join('');
filters.push(
  `${vIn}amix=inputs=${FALAS.length}:normalize=0,apad=whole_dur=${DURACAO},asplit=2[vo][vosc]`,
  `${sIn}amix=inputs=${SFX.length}:normalize=0[sfx]`,
  `[0:a]aresample=44100,volume=0.7[mus]`,
  `[mus][vosc]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=350[musd]`,
  `[musd][vo][sfx]amix=inputs=3:normalize=0,atrim=0:${DURACAO},afade=t=out:st=${DURACAO - 0.8}:d=0.8,loudnorm=I=-14:TP=-1.0:LRA=11[out]`,
);
const out = path.join(ROOT, 'out/audio-mix.wav');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filters.join(';'), '-map', '[out]', '-ar', '44100', '-ac', '2', out], { stdio: 'inherit' });
console.log('áudio:', out);
