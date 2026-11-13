// Renderiza só o áudio (WAV) via navegador headless — útil para conferir mix/loudness sem renderizar os frames.
import { createRequire } from 'node:module'; import { writeFileSync, mkdirSync } from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { serve } from './serve.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = createRequire('/usr/local/lib/node_modules_global/')('playwright')); }
const { srv, port } = await serve(0);
const args = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] };
let b; try { b = await chromium.launch(args); } catch { b = await chromium.launch({ ...args, executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' }); }
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', (e) => console.log('pageerror', e)); p.on('console', (m) => m.type() === 'error' && console.log(m.text().slice(0, 200)));
await p.goto(`http://localhost:${port}/?render=1`); await p.waitForFunction(() => window.CODRIAN_READY || window.CODRIAN_ERROR, null, { timeout: 120000 });
const b64 = await p.evaluate(async () => { const buf = await window.CODRIAN.renderAudioWav(); let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); });
mkdirSync(path.join(root, 'out'), { recursive: true }); writeFileSync(path.join(root, 'out/audio_mix.wav'), Buffer.from(b64, 'base64')); console.log('ok out/audio_mix.wav');
await b.close(); srv.close();
