// Exporta o Reel para MP4 H.264 (yuv420p, 30fps) com a narração.
//
//   node scripts/render.mjs [--voice=feminina|all] [--quality=low|high] [--mode=record|frames]
//
// --mode=record  (padrão pedido) Playwright grava a página em tempo real (recordVideo)
//                e mede quadros perdidos. Rápido, mas depende da máquina.
// --mode=frames  quadro a quadro: congela o relógio em cada t = i/30, tira screenshot
//                e manda pro ffmpeg. Determinístico, zero quadros perdidos.
import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { build, preview } from 'vite'
import { chromium } from './pw.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d
const quality = arg('quality', 'high')
const mode = arg('mode', 'record')
const FPS = 30
const scenes = JSON.parse(await fs.readFile(path.join(root, 'src/scenes.json'), 'utf8'))
const voiceArg = arg('voice', scenes.default)
const voiceKeys = voiceArg === 'all' ? Object.keys(scenes.voices) : [voiceArg]

const Q = quality === 'low'
  ? { w: 540, h: 960, crf: 30, preset: 'veryfast', abr: '96k', suffix: '-preview' }
  : { w: 1080, h: 1920, crf: 18, preset: 'slow', abr: '192k', suffix: '' }

const outDir = path.join(root, 'out')
await fs.mkdir(outDir, { recursive: true })

console.log('build…')
await build({ root, logLevel: 'warn' })
const server = await preview({ root, preview: { port: 4317, strictPort: false }, logLevel: 'warn' })
const base = server.resolvedUrls.local[0]

const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--hide-scrollbars'] })

async function preparePage(page, voice) {
  await page.goto(`${base}?render&voice=${voice}`)
  await page.waitForFunction(() => window.__ready === true)
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all(
      [
        ...['navalha', 'pettoca', 'flordesal'].flatMap((s) => ['antes', 'depois'].map((k) => `/cases/${s}-${k}.svg`)),
        '/brand/fundo-rede-story.jpg', '/brand/codrian-avatar-redondo.svg',
      ].map((src) => { const img = new Image(); img.src = src; return img.decode().catch(() => {}) }),
    )
  })
}

function ffmpeg(args) {
  return new Promise((res, rej) => {
    const p = spawn('ffmpeg', ['-y', '-v', 'error', ...args], { stdio: ['pipe', 'inherit', 'inherit'] })
    p.on('exit', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg saiu com ${c}`))))
    p.stdin.on('error', () => {})
    ffmpeg.last = p
  })
}

const encodeArgs = (total, audio) => [
  '-i', audio,
  '-map', '0:v', '-map', '1:a',
  '-c:v', 'libx264', '-preset', Q.preset, '-crf', String(Q.crf), '-pix_fmt', 'yuv420p', '-r', String(FPS),
  '-vf', `scale=${Q.w}:${Q.h}:flags=lanczos`,
  '-c:a', 'aac', '-b:a', Q.abr, '-ar', '48000',
  '-t', String(total), '-movflags', '+faststart',
]

for (const voice of voiceKeys) {
  const tl = scenes.voices[voice]
  const total = tl.total
  const audio = path.join(root, 'public', tl.track)
  const out = path.join(outDir, `codrian-reel-${voice}${Q.suffix}.mp4`)
  const t0 = Date.now()

  if (mode === 'frames') {
    const page = await browser.newPage({ viewport: { width: Q.w, height: Q.h } })
    await preparePage(page, voice)
    const frames = Math.round(total * FPS)
    const enc = ffmpeg(['-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', ...encodeArgs(total, audio), out])
    const stdin = ffmpeg.last.stdin
    for (let i = 0; i < frames; i++) {
      await page.evaluate((t) => window.__seek(t), i / FPS)
      const buf = await page.screenshot({ type: 'jpeg', quality: quality === 'low' ? 80 : 95 })
      if (!stdin.write(buf)) await new Promise((r) => stdin.once('drain', r))
      if (i % 90 === 0) process.stdout.write(`\r  ${voice}: quadro ${i}/${frames}`)
    }
    stdin.end()
    await enc
    await page.close()
    console.log(`\r  ${voice}: ${frames} quadros, 0 perdidos (determinístico) → ${path.relative(root, out)} [${((Date.now() - t0) / 1000).toFixed(0)}s]`)
  } else {
    const vidDir = path.join(outDir, 'raw')
    const ctx = await browser.newContext({ viewport: { width: Q.w, height: Q.h }, recordVideo: { dir: vidDir, size: { width: Q.w, height: Q.h } } })
    const ctxStart = Date.now()
    const page = await ctx.newPage()
    await preparePage(page, voice)
    const playStart = Date.now()
    const stats = await page.evaluate((total) => window.__play(total), total)
    await page.waitForTimeout(300)
    const video = page.video()
    await ctx.close()
    const webm = await video.path()
    const offset = (playStart - ctxStart) / 1000

    // quantos quadros reais o arquivo gravado tem no trecho útil?
    const ts = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v', '-show_entries', 'frame=pts_time', '-of', 'csv=p=0', webm]).toString()
      .trim().split('\n').map(Number).filter((t) => t >= offset && t <= offset + total)
    const expected = Math.round(total * FPS)
    // o screencast do Chromium só emite quadro quando há pintura e limita a cadência:
    // tudo que faltar vs. 30fps vira quadro duplicado (engasgo) no MP4
    const fileDropped = Math.max(0, expected - ts.length)
    await ffmpeg(['-ss', offset.toFixed(3), '-i', webm, ...encodeArgs(total, audio), out])
    const pct = ((fileDropped / expected) * 100).toFixed(1)
    console.log(`  ${voice}: rAF ${stats.frames} quadros (maior intervalo ${stats.maxGapMs}ms, ${stats.dropped} perdidos no navegador)`)
    console.log(`  ${voice}: vídeo gravado ${ts.length}/${expected} quadros únicos, ~${fileDropped} perdidos (${pct}%) → ${path.relative(root, out)}`)
    if (fileDropped > expected * 0.01) {
      console.warn(`  ⚠ A gravação em tempo real perdeu quadros (${pct}%). O MP4 vai ter "engasgos".`)
      console.warn('    Opções: --mode=frames (mesmas animações, quadro a quadro) ou migrar o render para Remotion.')
    }
  }
}

await browser.close()
server.httpServer.close()
