// Gera cada fala no ElevenLabs (com timestamps por caractere para legendas).
// Uso: node scripts/gen-voices.mjs [--force] [cue...]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { VOICES, FALAS } from './roteiro.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'assets/audio/vo');
const force = process.argv.includes('--force');
const only = process.argv.slice(2).filter(a => !a.startsWith('--'));

for (const f of FALAS) {
  if (only.length && !only.includes(f.cue)) continue;
  const mp3 = path.join(OUT, `${f.cue}.mp3`);
  if (fs.existsSync(mp3) && !force) { console.log('skip', f.cue); continue; }
  const v = VOICES[f.voz];
  // curl respeita o proxy do ambiente (fetch do Node não).
  const body = JSON.stringify({ text: f.texto, model_id: 'eleven_multilingual_v2', language_code: 'pt', voice_settings: v.settings });
  const raw = execFileSync('curl', ['-sS', '-f', '-X', 'POST',
    `https://api.elevenlabs.io/v1/text-to-speech/${v.id}/with-timestamps?output_format=mp3_44100_128`,
    '-H', 'Content-Type: application/json', '-H', `xi-api-key: ${process.env.ELEVENLABS_API_KEY || 'proxy'}`,
    '-d', body], { maxBuffer: 64 << 20 });
  const j = JSON.parse(raw.toString());
  fs.writeFileSync(mp3, Buffer.from(j.audio_base64, 'base64'));
  fs.writeFileSync(path.join(OUT, `${f.cue}.json`), JSON.stringify(j.alignment));
  const dur = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp3]).toString().trim();
  console.log('ok', f.cue, dur + 's');
}
