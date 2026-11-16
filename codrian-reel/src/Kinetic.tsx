import { motion, useTransform, cubicBezier, type MotionValue } from 'motion/react'

/** curvas da marca */
export const easeExpo = cubicBezier(0.16, 1, 0.3, 1)
export const easeCubic = cubicBezier(0.33, 1, 0.68, 1)

/**
 * Tipografia cinética da marca: cada letra sobe com desfoque que sai (14px → 0)
 * em curva exponencial — o mesmo gesto das letras do logo na abertura.
 * Tudo amostrado no relógio: o mesmo t gera sempre o mesmo quadro.
 */
export function Kinetic({
  text, l, at, stagger = 0.035, dur = 0.6, rise = 0.42, blur = 14, color, style, className,
}: {
  text: string; l: MotionValue<number>; at: number
  stagger?: number; dur?: number; rise?: number; blur?: number
  color?: string | MotionValue<string>; style?: React.CSSProperties; className?: string
}) {
  const words = text.split(' ')
  let i = 0
  return (
    <motion.span className={className} style={{ display: 'inline-block', color, ...style }}>
      {words.map((w, wi) => (
        <span key={wi} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
          {[...w].map((ch) => {
            const k = i++
            return <KChar key={k} ch={ch} l={l} at={at + k * stagger} dur={dur} rise={rise} blur={blur} />
          })}
          {wi < words.length - 1 && <span style={{ display: 'inline-block', width: '0.26em' }} />}
        </span>
      ))}
    </motion.span>
  )
}

function KChar({ ch, l, at, dur, rise, blur }: { ch: string; l: MotionValue<number>; at: number; dur: number; rise: number; blur: number }) {
  const p = useTransform(l, (t) => easeExpo(Math.min(1, Math.max(0, (t - at) / dur))))
  const op = useTransform(l, (t) => Math.min(1, Math.max(0, (t - at) / (dur * 0.45))))
  const transform = useTransform(p, (v) => `translateY(${(1 - v) * rise}em)`)
  const filter = useTransform(p, (v) => (v >= 0.999 ? 'none' : `blur(${(1 - v) * blur}px)`))
  return <motion.span style={{ display: 'inline-block', opacity: op, transform, filter }}>{ch}</motion.span>
}

/** linha inteira (assinatura): sobe 70% da altura com desfoque de 6px, 850ms, ease-out-cubic */
export function LineUp({ children, l, at, dur = 0.85, style }: { children: React.ReactNode; l: MotionValue<number>; at: number; dur?: number; style?: React.CSSProperties }) {
  const p = useTransform(l, (t) => easeCubic(Math.min(1, Math.max(0, (t - at) / dur))))
  return (
    <motion.div
      style={{
        ...style,
        opacity: useTransform(l, (t) => Math.min(1, Math.max(0, (t - at) / (dur * 0.5)))),
        transform: useTransform(p, (v) => `translateY(${(1 - v) * 70}%)`),
        filter: useTransform(p, (v) => (v >= 0.999 ? 'none' : `blur(${(1 - v) * 6}px)`)),
      }}
    >
      {children}
    </motion.div>
  )
}
