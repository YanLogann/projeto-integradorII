import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ClockProvider, useClock, useClockState, useSeekBridge } from './clock'
import { STAGE, SAFE, timeline, voices, getVoice } from './timeline'
import type { SceneId } from './script'
import { Captions } from './Captions'
import { Gancho } from './scenes/Gancho'
import { Dor } from './scenes/Dor'
import { Virada } from './scenes/Virada'
import { Serie } from './scenes/Serie'
import { Cta } from './scenes/Cta'
import type { SceneTiming } from './timeline'

const COMPONENTS: Record<SceneId, (p: { sc: SceneTiming }) => React.ReactNode> = {
  gancho: Gancho,
  dor: Dor,
  virada: Virada,
  serie: Serie,
  cta: Cta,
}

const params = new URLSearchParams(location.search)
const RENDER = params.has('render')
const DEBUG = params.has('safe')

function Scenes() {
  // índice da cena ativa — só muda nas fronteiras
  const idx = useClockState((t) => {
    const i = timeline.scenes.findIndex((s) => t >= s.start && t < s.end)
    return i === -1 ? timeline.scenes.length - 1 : i
  }) as number
  const sc = timeline.scenes[idx]
  const C = COMPONENTS[sc.id]
  return <C key={sc.id} sc={sc} />
}

function Stage() {
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const fit = () => setScale(Math.min(innerWidth / STAGE.w, innerHeight / STAGE.h))
    fit()
    addEventListener('resize', fit)
    return () => removeEventListener('resize', fit)
  }, [])
  return (
    <div className="viewport">
      <div className="stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <Scenes />
        <Captions />
        {DEBUG && (
          <>
            <div className="debug-safe" style={{ top: 0, height: SAFE.top }} />
            <div className="debug-safe" style={{ bottom: 0, height: SAFE.bottom }} />
          </>
        )}
      </div>
    </div>
  )
}

function PreviewControls() {
  const time = useClock()
  const audio = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const t = useClockState((t) => Math.floor(t * 10) / 10) as number
  useEffect(() => {
    let id = 0
    const loop = () => {
      if (audio.current) time.set(audio.current.currentTime)
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [time])
  const toggle = () => {
    const a = audio.current!
    if (a.paused) a.play(), setPlaying(true)
    else a.pause(), setPlaying(false)
  }
  return (
    <div className="controls">
      <audio ref={audio} src={timeline.track} onEnded={() => setPlaying(false)} preload="auto" />
      <button onClick={toggle}>{playing ? 'Pausar' : 'Tocar'}</button>
      <input
        type="range" min={0} max={timeline.total} step={0.01} value={t}
        onChange={(e) => (audio.current!.currentTime = +e.target.value)}
      />
      <span>{t.toFixed(1)}s / {timeline.total.toFixed(1)}s</span>
      <select value={getVoice()} onChange={(e) => { params.set('voice', e.target.value); location.search = params.toString() }}>
        {Object.entries(voices).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
      </select>
    </div>
  )
}

function Bridge() {
  useSeekBridge()
  return null
}

export default function App() {
  return (
    <ClockProvider>
      <Stage />
      {RENDER ? <Bridge /> : <PreviewControls />}
    </ClockProvider>
  )
}
