// Efeitos sonoros via ElevenLabs Sound Effects.
// Uso: node scripts/gen-sfx.mjs [--force]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'assets/audio/sfx');
const force = process.argv.includes('--force');

export const SFX = {
  sirene:   { d: 3.0, p: 'distant police siren wail in a rainy city at night, muffled, cinematic' },
  impacto:  { d: 2.0, p: 'deep cinematic trailer boom impact hit with sub bass and reverb tail' },
  whoosh:   { d: 1.0, p: 'fast cinematic whoosh swipe transition, airy' },
  obturador:{ d: 0.8, p: 'old film camera shutter click with flash pop' },
  glitch:   { d: 1.2, p: 'digital glitch stutter, data corruption, electronic' },
  teclado:  { d: 2.0, p: 'fast typing on a mechanical keyboard, close' },
  riser:    { d: 4.0, p: 'cinematic tension riser building up, synthetic, ends abruptly' },
  notif:    { d: 1.0, p: 'clean modern smartphone message notification pop, two tones' },
  carimbo:  { d: 1.0, p: 'heavy rubber stamp slammed on paper on a wooden desk' },
  batida:   { d: 1.5, p: 'single heartbeat thump, deep, cinematic' },
};

for (const [k, s] of Object.entries(SFX)) {
  const f = path.join(OUT, `${k}.mp3`);
  if (fs.existsSync(f) && !force) { console.log('skip', k); continue; }
  execFileSync('curl', ['-sS', '-f', '-X', 'POST', 'https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128',
    '-H', 'Content-Type: application/json', '-H', 'xi-api-key: proxy',
    '-d', JSON.stringify({ text: s.p, duration_seconds: s.d, prompt_influence: 0.5 }), '-o', f]);
  console.log('ok', k);
}
