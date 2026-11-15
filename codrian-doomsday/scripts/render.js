// Renderiza quadros: node scripts/render.js --out frames --from 0 --to 1800 --workers 4 [--times 0.5,12.3 --stills]
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.push([v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]) : 0, a), []));
const ROOT = path.resolve(__dirname, '..'); const OUT = path.resolve(ROOT, args.out || 'frames'); fs.mkdirSync(OUT, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); });
(async () => {
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  let jobs;
  if (args.times) jobs = String(args.times).split(',').map(Number).map(t => ({ t, name: `t_${t.toFixed(2)}.jpg` }));
  else { jobs = []; for (let f = +(args.from || 0); f < +(args.to || 1800); f += +(args.step || 1)) jobs.push({ f, name: `f_${String(f).padStart(5, '0')}.jpg` }); }
  jobs = jobs.filter(j => args.force || !fs.existsSync(path.join(OUT, j.name)));
  const nW = Math.min(+(args.workers || 4), jobs.length); let next = 0, done = 0; const t0 = Date.now();
  await Promise.all([...Array(nW)].map(async () => {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    page.on('console', m => { if (m.type() === 'error') console.error('PAGE', m.text()); }); page.on('pageerror', e => console.error('PAGEERR', e.message));
    await page.goto(`http://127.0.0.1:${port}/engine/index.html`); await page.evaluate(() => window.ready);
    while (next < jobs.length) { const j = jobs[next++];
      if (j.t != null) await page.evaluate(t => window.renderT(t), j.t); else await page.evaluate(f => window.render(f), j.f);
      await page.screenshot({ path: path.join(OUT, j.name), type: 'jpeg', quality: 95, clip: { x: 0, y: 0, width: 1080, height: 1920 } });
      done++; if (done % 30 === 0 || jobs.length < 40) { const el = (Date.now() - t0) / 1000; process.stdout.write(`${done}/${jobs.length} ${(el / done).toFixed(2)}s/q eta ${((jobs.length - done) * el / done / 60).toFixed(1)}min\n`); } }
    await page.close();
  }));
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
