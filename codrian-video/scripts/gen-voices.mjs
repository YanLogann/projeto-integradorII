// Gera as vozes no ElevenLabs (eleven_v3, com timestamps por caractere para legendas).
// Detetive: UMA tomada contínua com todas as falas → recortada por fala nos silêncios.
// Vítima: tomada própria.
// Uso: node scripts/gen-voices.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { VOICES, FALAS, MODEL } from './roteiro.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'assets/audio/vo');
const RAW = path.join(OUT, 'raw'); fs.mkdirSync(RAW, { recursive: true });
const dur = f => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());

function tts(voz, text, name) {
  const v = VOICES[voz];
  const body = JSON.stringify({ text, model_id: MODEL, language_code: 'pt', voice_settings: v.settings });
  // curl respeita o proxy do ambiente (fetch do Node não).
  const raw = execFileSync('curl', ['-sS', '-f', '-X', 'POST',
    `https://api.elevenlabs.io/v1/text-to-speech/${v.id}/with-timestamps?output_format=mp3_44100_128`,
    '-H', 'Content-Type: application/json', '-H', `xi-api-key: ${process.env.ELEVENLABS_API_KEY || 'proxy'}`,
    '-d', body], { maxBuffer: 64 << 20 });
  const j = JSON.parse(raw.toString());
  const mp3 = path.join(RAW, name + '.mp3');
  fs.writeFileSync(mp3, Buffer.from(j.audio_base64, 'base64'));
  fs.writeFileSync(path.join(RAW, name + '.json'), JSON.stringify(j.alignment));
  return { mp3, al: j.alignment };
}

// recorta [a,b] da tomada, com micro-fades (sem cliques) e salva alinhamento relativo
function cut(take, a, b, i0, i1, cue) {
  const out = path.join(OUT, `${cue}.mp3`);
  const d = b - a;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', a.toFixed(3), '-t', d.toFixed(3), '-i', take.mp3,
    '-af', `afade=t=in:d=0.015,afade=t=out:st=${Math.max(0, d - 0.12).toFixed(3)}:d=0.12`, '-c:a', 'libmp3lame', '-b:a', '192k', out]);
  const al = take.al, sl = (k) => al[k].slice(i0, i1);
  fs.writeFileSync(path.join(OUT, `${cue}.json`), JSON.stringify({
    characters: sl('characters'),
    character_start_times_seconds: sl('character_start_times_seconds').map(t => +(t - a).toFixed(3)),
    character_end_times_seconds: sl('character_end_times_seconds').map(t => +(t - a).toFixed(3)),
  }));
  console.log('ok', cue, d.toFixed(2) + 's');
}

function takeFor(voz) {
  const falas = FALAS.filter(f => f.voz === voz);
  // monta o texto lembrando onde cada fala começa/termina (em caracteres)
  let text = ''; const spans = [];
  falas.forEach((f, i) => {
    if (i) text += '\n\n';
    const tagged = `${f.tag} `;
    text += tagged;
    const s0 = text.length; text += f.texto;
    spans.push({ f, s0, s1: text.length });
  });
  const take = tts(voz, text, voz);
  const st = take.al.character_start_times_seconds, en = take.al.character_end_times_seconds;
  const total = dur(take.mp3);
  spans.forEach((sp, i) => {
    const speechA = st[sp.s0], speechB = en[sp.s1 - 1];
    const prevB = i ? en[spans[i - 1].s1 - 1] : 0;
    const nextA = spans[i + 1] ? st[spans[i + 1].s0] : total;
    // corta no meio do silêncio entre frases, preservando respiração e cauda
    const a = Math.max(prevB + (speechA - prevB) * 0.6, speechA - 0.25, 0);
    const b = Math.min(speechB + (nextA - speechB) * 0.5, speechB + 0.6, total);
    cut(take, a, b, sp.s0, sp.s1, sp.f.cue);
  });
}

takeFor('detetive');
takeFor('vitima');
