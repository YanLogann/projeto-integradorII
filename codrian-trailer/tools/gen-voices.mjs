// Gera as locuções (ElevenLabs) em assets/vo/*.mp3 e a envoltória de amplitude em assets/vo/envelopes.json
// Auth: se ELEVENLABS_API_KEY existir, usa; caso contrário depende de um proxy que injeta a credencial.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'assets/vo');
mkdirSync(outDir, { recursive: true });

export const VOICES = {
  yan:     { id: 'RErzarHnuYCmTJynOmz2', name: 'Yan v1' },            // narrador + IA
  rodrigo: { id: 'MZgw9H58206lPCPSJ70K', name: 'Rodrigo Ishikawa' },  // empresário
  rival:   { id: 'Q0l58S3V13QxkdteObmh', name: 'Thales' }             // concorrente
};

const LINES = [
  { id: 's1_headline', voice: 'yan', text: 'Sua empresa está perdendo dinheiro.',
    settings: { stability: 0.55, similarity_boost: 0.85, style: 0.35, speed: 0.92 } },
  { id: 's2_lunch', voice: 'rodrigo', text: 'Mas eu estava no almoço!',
    settings: { stability: 0.2, similarity_boost: 0.85, style: 0.85, speed: 1.0 } },
  { id: 's3_rival', voice: 'rival', text: 'Mais um cliente conquistado.',
    settings: { stability: 0.5, similarity_boost: 0.8, style: 0.4, speed: 0.95 } },
  { id: 's4_ai', voice: 'yan', text: 'Você não precisa trabalhar mais. Precisa trabalhar melhor.',
    settings: { stability: 0.6, similarity_boost: 0.9, style: 0.3, speed: 0.95 } },
  { id: 's5_narr', voice: 'yan', text: 'Sites, automações, inteligência artificial e soluções tecnológicas para transformar a maneira como sua empresa trabalha.',
    settings: { stability: 0.5, similarity_boost: 0.85, style: 0.35, speed: 1.08 } },
  { id: 's6_brand', voice: 'yan', text: 'CODRIAN. A tecnologia trabalhando a favor do seu negócio.',
    settings: { stability: 0.55, similarity_boost: 0.85, style: 0.4, speed: 1.0 } },
  { id: 's6_cta', voice: 'yan', text: 'Não fique para trás.',
    settings: { stability: 0.5, similarity_boost: 0.85, style: 0.5, speed: 0.95 } }
];

const only = process.argv.slice(2);
const key = process.env.ELEVENLABS_API_KEY;
for (const l of LINES) {
  if (only.length && !only.includes(l.id)) continue;
  const file = path.join(outDir, `${l.id}.mp3`);
  const body = JSON.stringify({ text: l.text, model_id: 'eleven_multilingual_v2', language_code: 'pt', voice_settings: { ...l.settings, use_speaker_boost: true } });
  const args = ['-sS', '-f', '-X', 'POST', `https://api.elevenlabs.io/v1/text-to-speech/${VOICES[l.voice].id}?output_format=mp3_44100_128`,
    '-H', 'Content-Type: application/json', '-d', body, '-o', file];
  if (key) args.push('-H', `xi-api-key: ${key}`);
  const r = spawnSync('curl', args, { encoding: 'utf8' });
  console.log(l.id, r.status === 0 ? 'ok' : 'ERRO ' + r.stderr);
}

// Envoltória de amplitude (30 amostras/s) para lip-sync e reatividade visual — determinística.
const env = {};
for (const l of LINES) {
  const f = path.join(outDir, `${l.id}.mp3`);
  if (!existsSync(f)) continue;
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', f, '-ac', '1', '-ar', '3000', '-f', 'f32le', '-'], { maxBuffer: 1 << 28 });
  const pcm = new Float32Array(r.stdout.buffer, r.stdout.byteOffset, Math.floor(r.stdout.length / 4));
  const win = 100; // 3000/30
  const arr = [];
  for (let i = 0; i < pcm.length; i += win) {
    let s = 0, n = 0;
    for (let j = i; j < Math.min(i + win, pcm.length); j++) { s += pcm[j] * pcm[j]; n++; }
    arr.push(+Math.sqrt(s / Math.max(n, 1)).toFixed(4));
  }
  const peak = Math.max(...arr, 1e-6);
  env[l.id] = { duration: +(pcm.length / 3000).toFixed(3), fps: 30, rms: arr.map(v => +(v / peak).toFixed(3)) };
}
writeFileSync(path.join(outDir, 'envelopes.json'), JSON.stringify(env));
console.log(Object.entries(env).map(([k, v]) => `${k}: ${v.duration}s`).join('\n'));
