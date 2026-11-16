import { motion, useTransform, type MotionValue } from 'motion/react'
import { easeOut, useLocal, useTween } from '../clock'
import { cue, type SceneTiming } from '../timeline'
import { BRAND, COPY } from '../script'

function useEnter(l: MotionValue<number>, at: number, dy = 40) {
  const op = useTween(l, at, 0.22, 0, 1)
  const y = useTween(l, at, 0.34, dy, 0)
  return { opacity: op, transform: useTransform(y, (v) => `translateY(${v}px)`) }
}

export function Cta({ sc }: { sc: SceneTiming }) {
  const l = useLocal(sc.start)
  const D = sc.end - sc.start
  const tTap = Math.min(D - 0.9, Math.max(2.6, cue(sc, 'agora', 0, 3.6) + 0.1))

  const logo = useEnter(l, 0)
  const handle = useEnter(l, 0.08)
  const btnIn = useEnter(l, 0.16, 60)
  const line = useEnter(l, 0.3)

  // pulso até o toque; toque = scale 0.96 (100ms) e volta; vira "Seguindo"
  const period = 1.0
  const pulse = useTransform(l, (t) => {
    if (t < 0.6) return 1
    if (t >= tTap) {
      const p = t - tTap
      if (p < 0.1) return 1 - 0.05 * (p / 0.1)
      return 0.95 + 0.05 * easeOut(Math.min(1, (p - 0.1) / 0.25))
    }
    const ph = ((t - 0.6) % period) / period
    return 1 + 0.06 * Math.sin(Math.PI * Math.min(1, ph / 0.4))
  })
  const ringPh = useTransform(l, (t) => (t < 0.6 || t >= tTap ? -1 : ((t - 0.6) % period) / period))
  const ringScale = useTransform(ringPh, (p) => (p < 0 ? 1 : 1 + 0.18 * easeOut(Math.min(1, p / 0.7))))
  const ringOp = useTransform(ringPh, (p) => (p < 0 ? 0 : 0.6 * (1 - Math.min(1, p / 0.7))))
  const followed = useTransform(l, (t) => (t >= tTap + 0.08 ? 1 : 0))
  const notFollowed = useTransform(followed, (f) => 1 - f)

  return (
    <div className="scene">
      <div className="safe" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 280, gap: 0 }}>
        <motion.div style={{ ...logo, display: 'flex', alignItems: 'center', gap: 28 }}>
          <div style={{ width: 150, height: 150, borderRadius: 40, background: 'var(--brand)', display: 'grid', placeItems: 'center', color: 'var(--brand-ink)', fontWeight: 900, fontSize: 112, lineHeight: 1 }} className="condensed">C</div>
          <div className="condensed" style={{ fontSize: 168, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}>{BRAND.name}</div>
        </motion.div>
        <motion.div style={{ ...handle, fontSize: 76, fontWeight: 700, color: 'var(--brand)', marginTop: 26 }}>{BRAND.handle}</motion.div>

        <motion.div style={{ ...btnIn, position: 'relative', marginTop: 70 }}>
          <motion.div style={{ position: 'absolute', inset: 0, borderRadius: 999, border: '6px solid var(--brand)', opacity: ringOp, transform: useTransform(ringScale, (s) => `scale(${s}, ${1 + (s - 1) * 2.5})`) }} />
          <motion.div
            style={{
              transform: useTransform(pulse, (s) => `scale(${s})`),
              width: 640, height: 150, borderRadius: 999, position: 'relative',
              display: 'grid', placeItems: 'center', fontSize: 66, fontWeight: 800,
            }}
          >
            <motion.div style={{ opacity: notFollowed, position: 'absolute', inset: 0, borderRadius: 999, background: 'var(--brand)', color: 'var(--brand-ink)', display: 'grid', placeItems: 'center' }}>{COPY.cta.follow}</motion.div>
            <motion.div style={{ opacity: followed, position: 'absolute', inset: 0, borderRadius: 999, border: '4px solid #55534d', color: 'var(--ink)', display: 'grid', placeItems: 'center' }}>Seguindo ✓</motion.div>
          </motion.div>
        </motion.div>

        <motion.div style={{ ...line, fontSize: 48, color: 'var(--muted)', marginTop: 54, fontWeight: 500 }}>{COPY.cta.line}</motion.div>
      </div>
    </div>
  )
}
