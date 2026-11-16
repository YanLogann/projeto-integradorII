import { motion, useTransform, type MotionValue } from 'motion/react'
import { easeExpo } from './Kinetic'
import { easeInOut, useSpringAt } from './clock'

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

/**
 * Celular "vivo" (como nos Reels): entra de lado em 3D, assenta e fica respirando
 * (leve balanço de rotação e flutuação). Opcional: aproximação de câmera em momentos-chave.
 */
export function usePhoneMotion(l: MotionValue<number>, zooms: { at: number; to: number }[] = []) {
  return useTransform(l, (t) => {
    const p = easeExpo(clamp01(t / 0.8))
    const ry = -30 * (1 - p) + -7 * p + 3.5 * Math.sin(t * 0.9) * p
    const rx = 8 * (1 - p) + 2 * Math.sin(t * 0.7 + 1) * p
    const y = 140 * (1 - p) + 10 * Math.sin(t * 1.1) * p
    let s = 0.9 + 0.1 * p
    for (const z of zooms) s *= 1 + (z.to - 1) * easeInOut(clamp01((t - z.at) / 0.6))
    return `perspective(2200px) translateY(${y}px) rotateY(${ry}deg) rotateX(${rx}deg) scale(${s})`
  })
}

/** toque de dedo: ponto que aparece + anel que se abre e some (coordenadas do pai) */
export function Tap({ l, at, x, y, size = 120, color = '#9d86ff' }: { l: MotionValue<number>; at: number; x: number; y: number; size?: number; color?: string }) {
  const p = useTransform(l, (t) => clamp01((t - at) / 0.55))
  const ring = useTransform(p, (v) => `scale(${0.35 + 0.9 * easeExpo(v)})`)
  const ringOp = useTransform(p, (v) => (v <= 0 || v >= 1 ? 0 : 1 - v))
  const dotOp = useTransform(l, (t) => (t < at - 0.12 || t > at + 0.3 ? 0 : 0.55))
  return (
    <>
      <motion.div style={{ position: 'absolute', left: x - size * 0.22, top: y - size * 0.22, width: size * 0.44, height: size * 0.44, borderRadius: '50%', background: '#ffffff', opacity: dotOp, pointerEvents: 'none' }} />
      <motion.div style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: '50%', border: `${Math.max(4, size / 22)}px solid ${color}`, opacity: ringOp, transform: ring, pointerEvents: 'none' }} />
    </>
  )
}

/** "pop" de entrada com spring curta (sem exagero: 0.85 → 1) */
export function Pop({ l, at, children, style }: { l: MotionValue<number>; at: number; children: React.ReactNode; style?: React.CSSProperties }) {
  const s = useSpringAt(l, at, 0.85, 1, { stiffness: 520, damping: 22 })
  const op = useTransform(l, (t) => clamp01((t - at) / 0.15))
  return <motion.div style={{ ...style, opacity: op, scale: s }}>{children}</motion.div>
}

/** risco de luz diagonal que atravessa a tela (abertura do Reel "futuro") */
export function LightStreak({ l, at, dur = 0.7 }: { l: MotionValue<number>; at: number; dur?: number }) {
  const p = useTransform(l, (t) => clamp01((t - at) / dur))
  const transform = useTransform(p, (v) => `translateX(${-900 + 2400 * easeInOut(v)}px) rotate(24deg)`)
  const op = useTransform(p, (v) => (v <= 0 || v >= 1 ? 0 : Math.sin(Math.PI * v)))
  return (
    <motion.div style={{ position: 'absolute', top: -300, left: 0, width: 10, height: 2600, transform, opacity: op, background: 'linear-gradient(transparent, #ffffff, #cfc6ee, transparent)', boxShadow: '0 0 40px 8px rgba(157,134,255,0.6)' }} />
  )
}

/** poeira de luz subindo (fechamento) — determinística */
const DUST = Array.from({ length: 34 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1
  return { x: 140 + r(1) * 800, y0: 520 + r(2) * 760, sp: 30 + r(3) * 70, sz: 3 + r(4) * 5, ph: r(5) * 6, lime: i % 9 === 0 }
})
export function Dust({ l, at = 0 }: { l: MotionValue<number>; at?: number }) {
  return <>{DUST.map((d, i) => <Mote key={i} d={d} l={l} at={at} />)}</>
}
function Mote({ d, l, at }: { d: (typeof DUST)[number]; l: MotionValue<number>; at: number }) {
  const transform = useTransform(l, (t) => `translate(${Math.sin(t * 0.8 + d.ph) * 14}px, ${-(t - at) * d.sp}px)`)
  const opacity = useTransform(l, (t) => clamp01((t - at) / 0.6) * (0.35 + 0.35 * Math.sin(t * 2 + d.ph)))
  return <motion.div style={{ position: 'absolute', left: d.x, top: d.y0, width: d.sz, height: d.sz, borderRadius: '50%', background: d.lime ? '#b7ff4a' : '#cfc6ee', boxShadow: `0 0 10px ${d.lime ? '#b7ff4a' : '#9d86ff'}`, transform, opacity }} />
}
