// Renderiza o vídeo quadro a quadro no Chromium (headless) e codifica com ffmpeg.
// Uso: node scripts/render.mjs [escala] [saida.mp4]   escala 0.5 = 540x960 (prévia), 1 = 1080x1920 (final)
import { createRequire } from 'node:module'; import { spawn } from 'node:child_process'; import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(new URL('..', import.meta.url).pathname);
const scale = parseFloat(process.argv[2] || '0.5'), out = process.argv[3] || `out/codrian_${Math.round(1920 * scale)}p.mp4`, FPS = 30;
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`file://${root}/index.html?render&scale=${scale}`); await p.waitForFunction(() => window.CD && CD.ready, null, { timeout: 30000 });
if (errs.length) { console.error(errs); process.exit(1); }
const dur = await p.evaluate(() => CD.DUR), N = Math.round(dur * FPS);
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', `${root}/out/mix.wav`,
  '-c:v', 'libx264', '-preset', scale < 1 ? 'veryfast' : 'slow', '-crf', scale < 1 ? '26' : '18', '-pix_fmt', 'yuv420p', '-r', String(FPS),
  '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', `${root}/${out}`], { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now();
for (let i = 0; i < N; i++) {
  const d = await p.evaluate((t) => CD.frameJPEG(t, 0.9), i / FPS);
  if (!ff.stdin.write(Buffer.from(d.slice(d.indexOf(',') + 1), 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
  if (i % 150 === 0) process.stdout.write(`frame ${i}/${N} (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
}
if (errs.length) console.error('erros na página:', errs);
ff.stdin.end(); await new Promise((r) => ff.on('close', r)); await b.close();
console.log('ok', out, `${N} frames em ${((Date.now() - t0) / 1000).toFixed(0)}s`);
