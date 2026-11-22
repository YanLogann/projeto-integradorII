// Gera quadros PNG em tempos específicos para revisão rápida: node scripts/stills.mjs 0.2 1.5 3.9
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(new URL('..', import.meta.url).pathname);
const times = process.argv.slice(2).map(Number);
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await p.goto('file://' + root + '/index.html?render&scale=0.4'); await p.waitForFunction(() => window.CD && CD.ready, null, { timeout: 20000 }).catch(() => {});
if (errs.length) console.log('ERR', errs);
fs.mkdirSync(root + '/out/stills', { recursive: true });
for (const t of times) {
  const d = await p.evaluate((t) => { try { return CD.frameJPEG(t, 0.85); } catch (e) { return 'ERR ' + e.stack; } }, t);
  if (d.startsWith('ERR')) { console.log(t, d); continue; }
  fs.writeFileSync(`${root}/out/stills/t${t.toFixed(2)}.jpg`, Buffer.from(d.split(',')[1], 'base64'));
}
await b.close(); console.log('ok', times.join(' '));
