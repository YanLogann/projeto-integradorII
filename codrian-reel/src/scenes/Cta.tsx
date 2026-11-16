import { motion, useTransform, type MotionValue } from 'motion/react'
import { easeOut, useLocal, useTween } from '../clock'
import { cue, type SceneTiming } from '../timeline'
import { BRAND, COPY } from '../script'
import { LogoBirth } from '../brand/Logo'
import { Kinetic, LineUp } from '../Kinetic'

function useEnter(l: MotionValue<number>, at: number, dy = 40) {
  const op = useTween(l, at, 0.22, 0, 1)
  const y = useTween(l, at, 0.34, dy, 0)
  return { opacity: op, transform: useTransform(y, (v) => `translateY(${v}px)`) }
}

export function Cta({ sc }: { sc: SceneTiming }) {
  const l = useLocal(sc.start)
  const D = sc.end - sc.start
  const tBtn = 1.9
  const tPulse = tBtn + 0.45
  const tTap = Math.min(D - 0.8, Math.max(tPulse + 1, cue(sc, 'agora', 0, 3.6) + 0.1))

  const bgOp = useTween(l, 0, 0.5, 0, 1)
  const row = useEnter(l, 1.7)
  const btnIn = useEnter(l, tBtn, 60)

  // pulso do botão até o toque; toque = 0.95 por 100ms e volta; vira "Seguindo"
  const period = 1.0
  const pulse = useTransform(l, (t) => {
    if (t < tPulse) return 1
    if (t >= tTap) {
      const p = t - tTap
      if (p < 0.1) return 1 - 0.05 * (p / 0.1)
      return 0.95 + 0.05 * easeOut(Math.min(1, (p - 0.1) / 0.25))
    }
    const ph = ((t - tPulse) % period) / period
    return 1 + 0.05 * Math.sin(Math.PI * Math.min(1, ph / 0.4))
  })
  const ringPh = useTransform(l, (t) => (t < tPulse || t >= tTap ? -1 : ((t - tPulse) % period) / period))
  const ringScale = useTransform(ringPh, (p) => (p < 0 ? 1 : 1 + 0.16 * easeOut(Math.min(1, p / 0.7))))
  const ringOp = useTransform(ringPh, (p) => (p < 0 ? 0 : 0.6 * (1 - Math.min(1, p / 0.7))))
  const followed = useTransform(l, (t) => (t >= tTap + 0.08 ? 1 : 0))
  const notFollowed = useTransform(followed, (f) => 1 - f)

  return (
    <div className="scene">
      <motion.img src="/brand/fundo-rede-story.jpg" width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: bgOp }} />
      <div className="safe" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 150 }}>
        <LogoBirth l={l} at={0.05} width={760} />

        <div style={{ textAlign: 'center', fontSize: 58, lineHeight: 1.12, letterSpacing: '-0.03em', marginTop: 6 }}>
          <LineUp l={l} at={1.05} style={{ color: 'var(--mist)', fontWeight: 500 }}>{BRAND.signature[0]}</LineUp>
          <LineUp l={l} at={1.35} style={{ color: 'var(--ink)', fontWeight: 700 }}>{BRAND.signature[1]}</LineUp>
        </div>

        <motion.div style={{ ...row, display: 'flex', alignItems: 'center', gap: 24, marginTop: 70 }}>
          <img src="/brand/codrian-avatar-redondo.svg" width={112} height={112} style={{ borderRadius: '50%', border: '2px solid var(--line)' }} />
          <Kinetic text={BRAND.handle} l={l} at={1.72} stagger={0.025} className="title" style={{ fontSize: 64, letterSpacing: '-0.03em' }} />
        </motion.div>

        <motion.div style={{ ...btnIn, position: 'relative', marginTop: 40 }}>
          <motion.div style={{ position: 'absolute', inset: 0, borderRadius: 999, border: '6px solid var(--lime)', opacity: ringOp, transform: useTransform(ringScale, (s) => `scale(${s}, ${1 + (s - 1) * 2.5})`) }} />
          <motion.div
            style={{
              transform: useTransform(pulse, (s) => `scale(${s})`),
              width: 600, height: 140, borderRadius: 999, position: 'relative', fontSize: 60, fontWeight: 700, letterSpacing: '-0.02em',
            }}
          >
            <motion.div style={{ opacity: notFollowed, position: 'absolute', inset: 0, borderRadius: 999, background: 'var(--lime)', color: 'var(--void)', display: 'grid', placeItems: 'center', boxShadow: '0 0 32px 0 rgba(183,255,74,0.45)' }}>{COPY.cta.follow}</motion.div>
            <motion.div style={{ opacity: followed, position: 'absolute', inset: 0, borderRadius: 999, border: '4px solid var(--mist)', color: 'var(--ink)', display: 'grid', placeItems: 'center', background: 'var(--void)' }}>{COPY.cta.following} ✓</motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
