// Pipeline de renderização: Chromium headless (WebGL via SwiftShader/GPU) -> frames JPEG -> FFmpeg (H.264 + AAC) -> MP4 1080x1920 30fps.
// Uso:
//   node tools/render.mjs                       # vídeo completo (1200 frames) -> out/codrian_trailer_1080x1920.mp4
//   node tools/render.mjs --frames 0-89         # intervalo de frames
//   node tools/render.mjs --still 0.5,4.5,17.8  # PNGs de inspeção em out/stills/
//   node tools/render.mjs --workers 4 --out out/x.mp4 --no-audio
import { createRequire } from 'node:module';
import { mkdirSync, rmSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = createRequire('/usr/local/lib/node_modules_global/')('playwright')); }

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : (process.argv[i + 1]?.startsWith('--') || process.argv[i + 1] === undefined ? true : process.argv[i + 1]); };
const FPS = 30, TOTAL = 40 * FPS;
const workers = Number(arg('workers', 3));
const outFile = path.resolve(root, arg('out', 'out/codrian_trailer_1080x1920.mp4'));
const framesDir = path.join(root, 'out/frames');
const stills = arg('still', null);
const noAudio = process.argv.includes('--no-audio');
const quality = Number(arg('quality', 94));

const { srv, port } = await serve(0);
const ARGS_BASE = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--autoplay-policy=no-user-gesture-required', '--disable-lcd-text', '--font-render-hinting=none'] };
// Chromium: padrão do Playwright; se o build não existir, usa o Chromium do sistema (CHROMIUM_PATH ou /opt/pw-browsers/chromium).
let browser;
try { browser = await chromium.launch(ARGS_BASE); }
catch { const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium'; browser = await chromium.launch({ ...ARGS_BASE, executablePath: exe }); }

async function openPage() {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) console.log(`[page:${m.type()}]`, m.text().slice(0, 300)); });
  page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 400)));
  await page.goto(`http://localhost:${port}/?render=1`);
  await page.waitForFunction(() => window.CODRIAN_READY || window.CODRIAN_ERROR, null, { timeout: 120000 });
  const err = await page.evaluate(() => window.CODRIAN_ERROR); if (err) throw new Error(err);
  return page;
}
const shot = async (page, t, file, type = 'png') => {
  await page.evaluate((tt) => window.CODRIAN.seek(tt), t);
  await page.screenshot({ path: file, type, ...(type === 'jpeg' ? { quality } : {}), clip: { x: 0, y: 0, width: 1080, height: 1920 } });
};

try {
  if (stills) {
    const dir = path.join(root, 'out/stills'); mkdirSync(dir, { recursive: true });
    const page = await openPage();
    for (const t of String(stills).split(',').map(Number)) { const t0 = Date.now(); await shot(page, t, path.join(dir, `t${t.toFixed(2)}.png`)); console.log(`still t=${t} (${Date.now() - t0}ms)`); }
  } else {
    let [a, b] = String(arg('frames', `0-${TOTAL - 1}`)).split('-').map(Number); if (b === undefined || isNaN(b)) b = a;
    rmSync(framesDir, { recursive: true, force: true }); mkdirSync(framesDir, { recursive: true });
    const pages = await Promise.all(Array.from({ length: workers }, openPage));
    let next = a, done = 0; const t0 = Date.now();
    await Promise.all(pages.map(async (page) => {
      for (;;) {
        const i = next++; if (i > b) break;
        await shot(page, i / FPS, path.join(framesDir, `f${String(i).padStart(5, '0')}.jpg`), 'jpeg');
        if (++done % 30 === 0) { const el = (Date.now() - t0) / 1000, rate = done / el; console.log(`frames ${done}/${b - a + 1}  ${rate.toFixed(2)} fps  ETA ${(((b - a + 1 - done) / rate) / 60).toFixed(1)} min`); }
      }
    }));
    // áudio: renderizado offline no navegador pelo mesmo motor da prévia
    let audioPath = null;
    if (!noAudio) {
      const page = pages[0];
      const has = await page.evaluate(() => !!window.CODRIAN.renderAudioWav);
      if (has) {
        const b64 = await page.evaluate(async () => { const buf = await window.CODRIAN.renderAudioWav(); let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); });
        audioPath = path.join(root, 'out/audio_mix.wav'); writeFileSync(audioPath, Buffer.from(b64, 'base64')); console.log('áudio mixado ->', audioPath);
      } else console.log('AVISO: motor de áudio indisponível; MP4 sairá mudo.');
    }
    mkdirSync(path.dirname(outFile), { recursive: true });
    const args = ['-y', '-framerate', String(FPS), '-start_number', String(a), '-i', path.join(framesDir, 'f%05d.jpg')];
    if (audioPath) args.push('-ss', String(a / FPS), '-i', audioPath);
    args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', '-r', String(FPS));
    if (audioPath) args.push('-c:a', 'aac', '-b:a', '256k', '-shortest');
    args.push(outFile);
    const r = spawnSync('ffmpeg', args, { stdio: 'inherit' }); if (r.status !== 0) throw new Error('ffmpeg falhou');
    console.log('MP4 ->', outFile);
  }
} finally { await browser.close(); srv.close(); }
