// Renderiza a timeline quadro a quadro com Playwright e envia para o ffmpeg.
// Uso:
//   node scripts/render.mjs --draft                 → 540x960 · 24fps (aprovação)
//   node scripts/render.mjs --final                 → 1080x1920 · 30fps
//   node scripts/render.mjs --stills 1,5.5,12       → PNGs de conferência em out/stills
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// playwright pré-instalado globalmente: resolvido via require
const { chromium } = createRequire(import.meta.url)('playwright');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const final = process.argv.includes('--final');
const scale = Number(arg('--scale', final ? 1 : 0.5));
const fps = Number(arg('--fps', final ? 30 : 24));
const stills = arg('--stills');
const out = arg('--out', path.join(ROOT, 'out', final ? 'video-final.mp4' : 'video-draft-mudo.mp4'));

const browser = await chromium.launch({ args: ['--disable-web-security', '--allow-file-access-from-files', '--font-render-hinting=none'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: scale });
page.on('pageerror', e => { console.error('ERRO NA PÁGINA:', e.message); process.exit(1); });
page.on('console', m => m.type() === 'error' && console.error('console:', m.text()));
await page.goto('file://' + path.join(ROOT, 'src/index.html'));
await page.waitForFunction(() => window.__ready === true);
const dur = await page.evaluate(() => window.__duration);

if (stills) {
  const dir = path.join(ROOT, 'out/stills'); fs.mkdirSync(dir, { recursive: true });
  for (const t of stills.split(',').map(Number)) {
    // percorre a timeline até t (renderização sequencial = igual ao vídeo)
    for (let x = 0; x < t; x += 0.25) await page.evaluate(v => __seek(v), x);
    await page.evaluate(v => __seek(v), t);
    await page.screenshot({ path: path.join(dir, `t${t.toFixed(2)}.png`) });
    console.log('still', t);
  }
  await browser.close(); process.exit(0);
}

const total = Math.round(dur * fps);
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
  '-c:v', 'libx264', '-preset', final ? 'slow' : 'veryfast', '-crf', final ? '16' : '26', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now();
for (let f = 0; f < total; f++) {
  await page.evaluate(v => __seek(v), f / fps);
  const buf = await page.screenshot({ type: 'jpeg', quality: final ? 95 : 80 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (f % fps === 0) process.stdout.write(`\r${(f / fps).toFixed(0)}s / ${dur}s  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));
await browser.close();
console.log('\nvídeo:', out);
