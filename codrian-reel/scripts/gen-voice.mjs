// Gera narração por cena (ElevenLabs TTS "with timestamps"), salva mp3 em
// public/voice/<voz>/ e escreve src/scenes.json com as durações REAIS do áudio.
//
// Uso: node scripts/gen-voice.mjs [masculina|feminina|jovem ...] [--force]
// Chave: ELEVENLABS_API_KEY em .env (nunca no código).

import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { SCENES, VOICES, TTS } from '../src/script.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
if (existsSync(path.join(root, '.env'))) process.loadEnvFile(path.join(root, '.env'))
const KEY = process.env.ELEVENLABS_API_KEY

const args = process.argv.slice(2)
const force = args.includes('--force')
const wanted = args.filter((a) => !a.startsWith('--'))
const voiceKeys = wanted.length ? wanted : Object.keys(VOICES)

const API = 'https://api.elevenlabs.io/v1/text-to-speech'

async function tts(voiceId, text, previous_text, next_text) {
  if (!KEY) {
    console.error('ELEVENLABS_API_KEY ausente. Crie .env a partir de .env.example.')
    process.exit(1)
  }
  const url = `${API}/${voiceId}/with-timestamps?output_format=mp3_44100_128`
  const body = {
    text,
    model_id: TTS.model,
    language_code: TTS.language,
    previous_text,
    next_text,
    voice_settings: { stability: 0.5, similarity_boost: 0.8, speed: 1.05 },
  }
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) return res.json()
    const msg = await res.text()
    // alguns modelos não aceitam previous/next_text: tenta sem
    if (res.status === 400 && (body.previous_text || body.next_text)) {
      delete body.previous_text
      delete body.next_text
      continue
    }
    if (attempt === 3 || res.status < 500) throw new Error(`TTS ${res.status}: ${msg}`)
    await new Promise((r) => setTimeout(r, 1000 * attempt))
  }
}

/** alignment por caractere -> palavras com início/fim */
function toWords(al) {
  const words = []
  let cur = null
  al.characters.forEach((ch, i) => {
    const s = al.character_start_times_seconds[i]
    const e = al.character_end_times_seconds[i]
    if (/\s/.test(ch)) {
      if (cur) words.push(cur), (cur = null)
      return
    }
    if (!cur) cur = { w: '', start: s, end: e }
    cur.w += ch
    cur.end = e
  })
  if (cur) words.push(cur)
  return words
}

function probeDuration(file) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file])
  return parseFloat(out.toString())
}

/** trechos de silêncio do mp3 [início, fim] (ffmpeg silencedetect, no stderr) */
function detectSilences(file, dur) {
  const err = spawnSync('ffmpeg', ['-v', 'info', '-i', file, '-af', 'silencedetect=n=-35dB:d=0.08', '-f', 'null', '-']).stderr.toString()
  const starts = [...err.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1])
  const ends = [...err.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1])
  return starts.map((s0, i) => [s0, ends[i] ?? dur])
}
/** fim real da fala: início do silêncio que vai até o fim do arquivo */
function speechEndFrom(silences, dur) {
  const last = silences.at(-1)
  return last && last[1] >= dur - 0.1 ? last[0] : dur
}

/**
 * O alinhamento "with-timestamps" estica a palavra que fecha frase (medido: 0,4–0,5s de atraso
 * contra a transcrição do áudio). Para cada palavra com pontuação final, se um silêncio real começa
 * antes do fim que o alinhamento diz, ancoramos a palavra logo após a anterior e terminamos no silêncio.
 */
function fixStretched(words, silences, speechEnd) {
  const out = words.map((w) => ({ ...w }))
  out.forEach((w, i) => {
    const isLast = i === out.length - 1
    if (!isLast && !/[.?!:]$/.test(w.w)) return
    const prevEnd = out[i - 1]?.end ?? 0
    const sil = isLast ? [speechEnd] : silences.find(([s0]) => s0 > prevEnd + 0.1 && s0 < w.end - 0.05)
    if (!sil || w.end <= sil[0] + 0.05) return
    w.start = Math.min(w.start, prevEnd + 0.02)
    w.end = Math.max(w.start + 0.1, sil[0])
  })
  return out
}

const round = (n) => Math.round(n * 1000) / 1000
const scenesPath = path.join(root, 'src', 'scenes.json')
const scenesJson = existsSync(scenesPath) ? JSON.parse(await fs.readFile(scenesPath, 'utf8')) : { fps: 30, voices: {} }

for (const key of voiceKeys) {
  const voice = VOICES[key]
  if (!voice) throw new Error(`voz desconhecida: ${key}`)
  const dir = path.join(root, 'public', 'voice', key)
  await fs.mkdir(dir, { recursive: true })
  console.log(`\n== ${voice.label}`)

  let t = 0
  const scenes = []
  for (const [i, sc] of SCENES.entries()) {
    const mp3 = path.join(dir, `${sc.id}.mp3`)
    const align = path.join(dir, `${sc.id}.json`)
    let words
    if (!force && existsSync(mp3) && existsSync(align)) {
      words = JSON.parse(await fs.readFile(align, 'utf8'))
    } else {
      const r = await tts(voice.id, sc.narration, SCENES[i - 1]?.narration, SCENES[i + 1]?.narration)
      await fs.writeFile(mp3, Buffer.from(r.audio_base64, 'base64'))
      words = toWords(r.alignment ?? r.normalized_alignment)
      await fs.writeFile(align, JSON.stringify(words))
    }
    const audioDur = probeDuration(mp3)
    const silences = detectSilences(mp3, audioDur)
    const speechEnd = speechEndFrom(silences, audioDur)
    words = fixStretched(words, silences, speechEnd)
    const duration = Math.max(sc.minDuration, TTS.lead + speechEnd + TTS.tail)
    scenes.push({
      id: sc.id,
      start: round(t),
      end: round(t + duration),
      audio: `/voice/${key}/${sc.id}.mp3`,
      audioOffset: round(t + TTS.lead),
      audioDuration: round(audioDur),
      // corte: logo após o fim real da fala (o mp3 pode trazer estalos no silêncio final)
      audioCut: round(Math.min(audioDur, speechEnd + 0.12)),
      words: words.map((w) => ({ w: w.w, start: round(t + TTS.lead + w.start), end: round(t + TTS.lead + w.end) })),
    })
    console.log(`  ${sc.id.padEnd(7)} fala ${speechEnd.toFixed(2)}s -> cena ${t.toFixed(2)}–${(t + duration).toFixed(2)}s`)
    t += duration
  }

  // trilha única (preview no navegador + render)
  const full = path.join(dir, 'full.wav')
  const inputs = scenes.flatMap((s) => ['-i', path.join(root, 'public', s.audio)])
  // cada fala: corta após o fim real, fade-in de 10ms e fade-out de 80ms (sem cliques nas emendas)
  const filters = scenes
    .map((s, i) => `[${i}]atrim=0:${s.audioCut},afade=t=in:d=0.01,afade=t=out:st=${Math.max(0, s.audioCut - 0.08)}:d=0.08,adelay=${Math.round(s.audioOffset * 1000)}:all=1[a${i}]`)
    .join(';')
  const mix = `${filters};${scenes.map((_, i) => `[a${i}]`).join('')}amix=inputs=${scenes.length}:normalize=0,apad,atrim=0:${round(t)}[out]`
  execFileSync('ffmpeg', ['-y', '-v', 'error', ...inputs, '-filter_complex', mix, '-map', '[out]', '-ar', '48000', full])

  scenesJson.voices[key] = { label: voice.label, voiceId: voice.id, total: round(t), track: `/voice/${key}/full.wav`, scenes }
  console.log(`  total ${t.toFixed(2)}s`)
}

scenesJson.default ??= voiceKeys[0]
await fs.writeFile(scenesPath, JSON.stringify(scenesJson, null, 2))
console.log(`\nscenes.json atualizado (${Object.keys(scenesJson.voices).join(', ')})`)
