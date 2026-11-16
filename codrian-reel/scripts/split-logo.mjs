// Separa o path único da logo oficial em letras (para animar "nascendo do ponto").
// As curvas são as do arquivo oficial; nada é redigitado.
import fs from 'node:fs'
import { chromium } from './pw.mjs'
const svg = fs.readFileSync('public/brand/codrian-logo-negativo.svg', 'utf8')
const d = svg.match(/<path[^>]* d="([^"]+)"/)[1]
const vb = svg.match(/viewBox="([^"]+)"/)[1]
const dot = svg.match(/<circle cx="([\d.-]+)" cy="([\d.-]+)" r="([\d.]+)"/)
const b = await chromium.launch(); const p = await b.newPage()
const letters = await p.evaluate((d) => {
  const ns = 'http://www.w3.org/2000/svg'
  const s = document.createElementNS(ns, 'svg'); document.body.appendChild(s)
  const subs = d.split(/(?=M)/).map((x) => x.trim()).filter(Boolean)
  const boxes = subs.map((sp) => { const e = document.createElementNS(ns, 'path'); e.setAttribute('d', sp); s.appendChild(e); const bb = e.getBBox(); return { sp, x0: bb.x, x1: bb.x + bb.width } })
  // agrupa subpaths sobrepostos no eixo x (miolo do "o", do "d"... e o pingo do "i")
  boxes.sort((a, b) => a.x0 - b.x0)
  const groups = []
  for (const bx of boxes) {
    const g = groups.find((g) => bx.x0 < g.x1 - 5 && bx.x1 > g.x0 + 5)
    if (g) { g.d += ' ' + bx.sp; g.x0 = Math.min(g.x0, bx.x0); g.x1 = Math.max(g.x1, bx.x1) } else groups.push({ d: bx.sp, x0: bx.x0, x1: bx.x1 })
  }
  return groups.sort((a, b) => a.x0 - b.x0)
}, d)
await b.close()
const out = { viewBox: vb, fill: '#F4F1FF', dot: { cx: +dot[1], cy: +dot[2], r: +dot[3], fill: '#B7FF4A' }, letters: letters.map((l) => ({ d: l.d, x0: Math.round(l.x0), x1: Math.round(l.x1) })) }
fs.writeFileSync('src/brand/logo.json', JSON.stringify(out))
console.log(out.letters.length, 'letras:', out.letters.map((l) => `${l.x0}-${l.x1}`).join(' '))
