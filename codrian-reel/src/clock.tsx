import { createContext, useContext, useEffect, useState } from 'react'
import { useMotionValue, useMotionValueEvent, useTransform, cubicBezier, spring, type MotionValue } from 'motion/react'

/**
 * UM relógio: `time` (segundos). Tudo na tela é função dele.
 * - preview: segue audio.currentTime
 * - render: o script de export chama window.__seek(t) quadro a quadro
 *   (ou window.__play() para gravação em tempo real)
 */
const ClockCtx = createContext<MotionValue<number> | null>(null)
export const useClock = () => useContext(ClockCtx)!

export function ClockProvider({ children }: { children: React.ReactNode }) {
  const time = useMotionValue(0)
  return <ClockCtx.Provider value={time}>{children}</ClockCtx.Provider>
}

/** número React que acompanha o relógio (para montar/desmontar, legenda) */
export function useClockState(sel: (t: number) => number | string = (t) => t) {
  const time = useClock()
  const [v, setV] = useState(() => sel(time.get()))
  useMotionValueEvent(time, 'change', (t) => setV(sel(t)))
  return v
}

// ---------- curvas (emil-design-eng: ease-out forte, nada de ease-in)
export const easeOut = cubicBezier(0.23, 1, 0.32, 1)
export const easeInOut = cubicBezier(0.77, 0, 0.175, 1)

type Num = number
/** tempo local da cena */
export function useLocal(start: number) {
  const time = useClock()
  return useTransform(time, (t) => t - start)
}

/** interpolação presa ao relógio: de `from` p/ `to` entre at e at+dur */
export function useTween(local: MotionValue<number>, at: Num, dur: Num, from: Num, to: Num, ease = easeOut) {
  return useTransform(local, [at, at + dur], [from, to], { ease, clamp: true })
}

/** spring amostrada no relógio (determinística: mesmo t => mesmo valor) */
export function useSpringAt(
  local: MotionValue<number>,
  at: Num,
  from: Num,
  to: Num,
  opts: { stiffness?: number; damping?: number; mass?: number; velocity?: number } = {},
) {
  const gen = spring({ keyframes: [from, to], stiffness: 500, damping: 20, ...opts })
  return useTransform(local, (l) => (l < at ? from : gen.next((l - at) * 1000).value))
}

export function useSeekBridge() {
  const time = useClock()
  useEffect(() => {
    const raf = () => new Promise<void>((r) => requestAnimationFrame(() => r()))
    const w = window as any
    w.__seek = async (t: number) => {
      time.set(t)
      await raf()
      await raf()
    }
    // gravação em tempo real: relógio = performance.now(); mede quadros perdidos
    w.__play = (total: number) =>
      new Promise<{ frames: number; dropped: number; maxGapMs: number }>((resolve) => {
        const t0 = performance.now()
        let last = t0
        let frames = 0
        let dropped = 0
        let maxGap = 0
        const tick = (now: number) => {
          const gap = now - last
          if (frames > 0) {
            maxGap = Math.max(maxGap, gap)
            if (gap > (1000 / 30) * 1.5) dropped += Math.round(gap / (1000 / 30)) - 1
          }
          last = now
          frames++
          const t = (now - t0) / 1000
          time.set(Math.min(t, total))
          if (t < total) requestAnimationFrame(tick)
          else resolve({ frames, dropped, maxGapMs: Math.round(maxGap) })
        }
        requestAnimationFrame(tick)
      })
    w.__ready = true
  }, [time])
}
