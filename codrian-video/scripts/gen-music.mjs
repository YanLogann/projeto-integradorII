// Trilha original via ElevenLabs Music, com seções cronometradas para casar com os cortes.
// Uso: node scripts/gen-music.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'assets/audio/music/trilha.mp3');

const global = ['dark cinematic trailer', 'instrumental', 'modern hybrid electronic', 'tense', 'no vocals'];
const plan = {
  positive_global_styles: global,
  negative_global_styles: ['vocals', 'singing', 'lyrics', 'happy pop', 'acoustic guitar'],
  sections: [
    { section_name: 'Investigacao', duration_ms: 21200, positive_local_styles: ['ticking clock pulse', 'low sub drone', 'muted taiko hits', 'detective noir tension', 'sparse'], negative_local_styles: ['drops', 'melody'], lines: [] },
    { section_name: 'Silencio', duration_ms: 3000, positive_local_styles: ['near silence', 'single reversed swell', 'suspense'], negative_local_styles: ['drums'], lines: [] },
    { section_name: 'Revelacao', duration_ms: 7000, positive_local_styles: ['rising synth arpeggio', 'building riser', 'hopeful tension', 'pulsing bass'], negative_local_styles: [], lines: [] },
    { section_name: 'Solucao', duration_ms: 9800, positive_local_styles: ['confident electronic beat', 'wide synth pads', 'triumphant', 'punchy drums', 'premium tech ad'], negative_local_styles: [], lines: [] },
    { section_name: 'Final', duration_ms: 4000, positive_local_styles: ['final big impact hit', 'long reverb tail', 'fade out'], negative_local_styles: [], lines: [] },
  ],
};

const raw = execFileSync('curl', ['-sS', '-f', '-X', 'POST', 'https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128',
  '-H', 'Content-Type: application/json', '-H', 'xi-api-key: proxy',
  '-d', JSON.stringify({ composition_plan: plan, model_id: 'music_v1' }), '-o', OUT], { maxBuffer: 64 << 20 });
console.log(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', OUT]).toString());
