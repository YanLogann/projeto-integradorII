import scenesJson from './scenes.json'
import type { SceneId, VoiceKey } from './script'

export interface Word { w: string; start: number; end: number }
export interface SceneTiming {
  id: SceneId
  start: number
  end: number
  audio: string
  audioOffset: number
  audioDuration: number
  words: Word[]
}
export interface VoiceTimeline { label: string; voiceId: string; total: number; track: string; scenes: SceneTiming[] }

const data = scenesJson as unknown as { fps: number; default: VoiceKey; voices: Record<VoiceKey, VoiceTimeline> }

export const FPS = data.fps
export const STAGE = { w: 1080, h: 1920 }
/** Instagram cobre o topo e a base do Reel */
export const SAFE = { top: 250, bottom: 400, side: 72 }

export function getVoice(): VoiceKey {
  const v = new URLSearchParams(location.search).get('voice') as VoiceKey | null
  return v && data.voices[v] ? v : data.default
}
export const voices = data.voices
export const timeline: VoiceTimeline = data.voices[getVoice()]

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')

/** tempo LOCAL (s, relativo ao início da cena) em que a palavra começa a ser falada */
export function cue(scene: SceneTiming, word: string, nth = 0, fallback = 0): number {
  const hits = scene.words.filter((w) => norm(w.w) === norm(word))
  const hit = hits[nth]
  return hit ? hit.start - scene.start : fallback
}
export const sceneById = (id: SceneId) => timeline.scenes.find((s) => s.id === id)!
