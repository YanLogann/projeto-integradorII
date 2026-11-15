// Mixagem: trilha (com ducking sob a voz) + vozes ElevenLabs + SFX sincronizados às palavras.
// Saída: out/audio-mix.wav (45s, -14 LUFS aprox.)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync, spawnSync } from 'node:child_process';
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

// [arquivo, tempo, volume, filtro extra opcional]
// Regra: efeito que cai em cima de fala fica baixo (≤ .5) para não "comer" sílaba.
const SFX = [
  // sirene: entra cheia no 1º frame, desce para cama sob a narração e some até 5.5s
  ['sirene', 0.0, 1.0, "volume='if(lt(t,0.45),1,max(0.28,1-(t-0.45)*1.6))':eval=frame,afade=t=out:st=4.2:d=1.4"],
  ['impacto', 0.3, .85], ['glitch', 1.05, .25],
  ['whoosh', 4.35, .5], ['obturador', 4.6, .7], ['carimbo', wt('vitima', 'vítima') + .3, .45],
  ['whoosh', 7.85, .45], ['notif', wt('depoimento', 'direct'), .4], ['glitch', wt('depoimento', 'sumiu') + .5, .25],
  ['whoosh', 11.8, .5], ['notif', wt('pista', 'Achou') + .45, .3],
  ...[0, 1, 2, 3].map(i => ['batida', tQ + i * (tSaiu - tQ) / 4, .6]),
  ['glitch', tSaiu, .4], ['carimbo', tSaiu + .2, .6],
  ['whoosh', 17.05, .5], ['carimbo', wt('concorrente', 'concorrente') + .5, .55],
  ['impacto', 21.2, .9], ['batida', 21.35, .7], ['glitch', 23.85, .45],
  ['whoosh', 23.9, .45], ['impacto', falha('site'), .3], ['impacto', falha('prova'), .3], ['impacto', falha('caminho'), .35],
  ['riser', tLP - 4.0, .5], ['impacto', tLP, .8], ['glitch', tLP, .25],
  ['whoosh', wt('lp', 'Mostra') - .1, .3], ['whoosh', wt('lp', 'leva') - .1, .3], ['notif', tWa + .3, .55],
  ['whoosh', 37.1, .5], ['carimbo', wt('encerrado', 'encerrado') + .2, .7], ['impacto', wt('encerrado', 'CODRIAN') - .05, .6],
  ['notif', wt('cta', 'Siga') + .95, .5],
];

const inputs = ['-i', A('music/trilha.mp3')];
const filters = [];
FALAS.forEach((f, i) => {
  inputs.push('-i', A(`vo/${f.cue}.mp3`));
  filters.push(`[${i + 1}:a]aresample=44100,adelay=${Math.round(f.at * 1000)}:all=1[v${i}]`);
});
const base = FALAS.length + 1;
SFX.forEach(([name, t, vol, extra], j) => {
  inputs.push('-i', A(`sfx/${name}.mp3`));
  filters.push(`[${base + j}:a]aresample=44100,${extra ? extra + ',' : ''}volume=${vol},adelay=${Math.max(0, Math.round(t * 1000))}:all=1[s${j}]`);
});
const vIn = FALAS.map((_, i) => `[v${i}]`).join('');
const sIn = SFX.map((_, j) => `[s${j}]`).join('');
const chain = norm => [
  // voz: compressão suave + presença, sem limitar transientes
  `${vIn}amix=inputs=${FALAS.length}:normalize=0,highpass=f=70,acompressor=threshold=0.12:ratio=2.5:attack=8:release=180:makeup=1.6,equalizer=f=3200:t=q:w=1:g=2,apad=whole_dur=${DURACAO},asplit=2[vo][vosc]`,
  `${sIn}amix=inputs=${SFX.length}:normalize=0[sfx]`,
  `[0:a]aresample=44100,volume=0.6[mus]`,
  // ducking mais suave: a trilha desce e volta devagar (sem "bombear" entre frases)
  `[mus][vosc]sidechaincompress=threshold=0.05:ratio=3:attack=40:release=900:knee=4[musd]`,
  `[musd][vo][sfx]amix=inputs=3:normalize=0,atrim=0:${DURACAO},afade=t=out:st=${DURACAO - 0.8}:d=0.8,${norm}[out]`,
].join(';');

const graph = norm => filters.join(';') + ';' + chain(norm);

// loudnorm em 2 passadas (modo linear = ganho constante, sem "bombear")
const LN = 'loudnorm=I=-14:TP=-1.0:LRA=11';
const p1 = spawnSync('ffmpeg', ['-hide_banner', '-nostats', ...inputs, '-filter_complex', graph(LN + ':print_format=json'), '-map', '[out]', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 64 << 20 });
const m = JSON.parse(p1.stderr.slice(p1.stderr.lastIndexOf('{'), p1.stderr.lastIndexOf('}') + 1));
const norm = `${LN}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
const out = path.join(ROOT, 'out/audio-mix.wav');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', graph(norm), '-map', '[out]', '-ar', '44100', '-ac', '2', out], { stdio: 'inherit' });
console.log('áudio:', out, `(entrada ${m.input_i} LUFS → -14)`);
