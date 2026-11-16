// Snapshots de verificação: node scripts/snap.mjs <outDir> <voz> t1 t2 ...
import { chromium } from './pw.mjs'
const [out, voice, ...ts] = process.argv.slice(2)
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 540, height: 960 } })
const errs = []
p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
await p.goto(`http://localhost:5173/?render&safe&voice=${voice}`)
await p.waitForFunction(() => window.__ready)
await p.evaluate(() => document.fonts.ready)
for (const t of ts) { await p.evaluate((t) => window.__seek(t), +t); await p.screenshot({ path: `${out}/${voice}-${t}.png` }) }
if (errs.length) console.log('ERRORS:', errs)
await b.close()
