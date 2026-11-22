// Renderiza o vídeo quadro a quadro.
// Uso: node render.cjs stills 0.5,5,10.5   -> PNGs de teste em out/stills
//      node render.cjs video [fps] [workers] -> out/frames + out/codrian-no-radar.mp4
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');

const ROOT = __dirname, PORT = 5178;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });
  page.on('pageerror', e => console.error('[pageerror]', e.message));
  await page.goto(`http://localhost:${PORT}/index.html`);
  await page.waitForFunction(() => window.__ready);
  await page.evaluate(() => window.__ready);
  return page;
}
const ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const mode = process.argv[2] || 'stills';
  if (mode === 'stills') {
    const times = (process.argv[3] || '0.5,2,3.3,5,8,9.8,10.5,11.5,13.5,17,22,26,29.5,31.9').split(',').map(Number);
    const dir = path.join(ROOT, 'out/stills'); fs.mkdirSync(dir, { recursive: true });
    const browser = await chromium.launch({ args: ARGS });
    const page = await openPage(browser);
    for (const t of times) {
      const t0 = Date.now();
      await page.evaluate(t => window.__render(t), t);
      await page.screenshot({ path: path.join(dir, `t${t.toFixed(2)}.png`) });
      console.log('still', t, (Date.now() - t0) + 'ms');
    }
    await browser.close();
  } else {
    const fps = +(process.argv[3] || 30), workers = +(process.argv[4] || 2);
    const total = Math.round(32 * fps);
    const dir = path.join(ROOT, 'out/frames'); fs.mkdirSync(dir, { recursive: true });
    const start = Date.now(); let done = 0;
    const run = async (wi) => {
      const browser = await chromium.launch({ args: ARGS });
      const page = await openPage(browser);
      for (let f = wi; f < total; f += workers) {
        const file = path.join(dir, `f${String(f).padStart(5, '0')}.png`);
        if (fs.existsSync(file)) { done++; continue; }
        await page.evaluate(([t, f]) => window.__render(t, f), [f / fps, f]);
        await page.screenshot({ path: file });
        done++;
        if (done % 30 === 0) { const el = (Date.now() - start) / 1000; console.log(`${done}/${total}  ${el.toFixed(0)}s  eta ${(el / done * (total - done)).toFixed(0)}s`); }
      }
      await browser.close();
    };
    await Promise.all([...Array(workers)].map((_, i) => run(i)));
    const outFile = path.join(ROOT, 'out/codrian-no-radar.mp4');
    execFileSync('ffmpeg', ['-y', '-framerate', String(fps), '-i', path.join(dir, 'f%05d.png'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', '-an', outFile], { stdio: 'inherit' });
    console.log('ok', outFile);
  }
  server.close();
})();
