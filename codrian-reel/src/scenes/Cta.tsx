import { motion, useTransform } from 'motion/react'
import { easeOut, useLocal, useTween } from '../clock'
import { cue, type SceneTiming } from '../timeline'
import { BRAND, COPY } from '../script'
import { LogoBirth } from '../brand/Logo'
import { Dust } from '../motionKit'
import type { MotionValue } from 'motion/react'

/** fechamento no estilo dos Reels: fundo escuro, anéis finos, logo com reflexo, linha lilás pequena */
export function Cta({ sc }: { sc: SceneTiming }) {
  const l = useLocal(sc.start)
  const D = sc.end - sc.start
  const tHandle = 1.5
  const tBtn = 1.75
  const tPulse = tBtn + 0.45
  const tTap = Math.min(D - 0.8, Math.max(tPulse + 1, cue(sc, 'agora', 0, 3.6) + 0.1))

  const handleOp = useTween(l, tHandle, 0.3, 0, 1)
  const handleY = useTween(l, tHandle, 0.4, 20, 0)
  const btnOp = useTween(l, tBtn, 0.25, 0, 1)
  const btnY = useTween(l, tBtn, 0.4, 40, 0)

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
  const ringOp = useTransform(ringPh, (p) => (p < 0 ? 0 : 0.7 * (1 - Math.min(1, p / 0.7))))
  const followed = useTransform(l, (t) => (t >= tTap + 0.08 ? 1 : 0))
  const notFollowed = useTransform(followed, (f) => 1 - f)
  const ringsRot = 'none'

  return (
    <div className="scene" style={{ background: 'radial-gradient(60% 40% at 50% 40%, #241653 0%, #120c2a 55%, #0a0716 100%)' }}>
      <motion.svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, transform: ringsRot, transformOrigin: '540px 720px' }}>
        {[0, 1, 2].map((i) => <PingRing key={i} l={l} i={i} />)}
      </motion.svg>
      <Dust l={l} at={0.5} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 560, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <LogoBirth l={l} at={0.05} width={720} />
        {/* reflexo no chão, como no fechamento dos Reels */}
        <div style={{ transform: 'scaleY(-1)', opacity: 0.22, filter: 'blur(5px)', marginTop: -110, WebkitMaskImage: 'linear-gradient(to top, #000 0%, transparent 55%)', maskImage: 'linear-gradient(to top, #000 0%, transparent 55%)' }}>
          <LogoBirth l={l} at={0.05} width={720} />
        </div>
      </div>
      <motion.div style={{ position: 'absolute', left: 0, right: 0, top: 900, textAlign: 'center', fontSize: 44, fontWeight: 500, color: 'var(--mist)', opacity: handleOp, transform: useTransform(handleY, (y) => `translateY(${y}px)`) }}>
        {BRAND.handle}
      </motion.div>
      <motion.div style={{ position: 'absolute', left: 540 - 270, top: 1000, opacity: btnOp, transform: useTransform(btnY, (y) => `translateY(${y}px)`) }}>
        <motion.div style={{ position: 'absolute', inset: 0, borderRadius: 999, border: '5px solid #9d86ff', opacity: ringOp, transform: useTransform(ringScale, (s) => `scale(${s}, ${1 + (s - 1) * 2.5})`) }} />
        <motion.div style={{ transform: useTransform(pulse, (s) => `scale(${s})`), width: 540, height: 124, borderRadius: 999, position: 'relative', fontSize: 52, fontWeight: 700, letterSpacing: '-0.02em' }}>
          <motion.div style={{ opacity: notFollowed, position: 'absolute', inset: 0, borderRadius: 999, background: 'var(--violet)', color: 'var(--ink)', display: 'grid', placeItems: 'center', boxShadow: '0 0 60px rgba(105,56,232,0.6)' }}>{COPY.cta.follow}</motion.div>
          <motion.div style={{ opacity: followed, position: 'absolute', inset: 0, borderRadius: 999, border: '3px solid var(--mist)', color: 'var(--ink)', display: 'grid', placeItems: 'center' }}>{COPY.cta.following} ✓</motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}

/** anéis finos que se abrem a partir da logo, em loop lento (ping da marca) */
function PingRing({ l, i }: { l: MotionValue<number>; i: number }) {
  const period = 2.4
  const ph = useTransform(l, (t) => (t < 0.5 ? -1 : (((t - 0.5) / period + i / 3) % 1)))
  const r = useTransform(ph, (p) => (p < 0 ? 0 : 180 + 420 * p))
  const op = useTransform(ph, (p) => (p < 0 ? 0 : 0.35 * Math.sin(Math.PI * p)))
  return <motion.circle cx={540} cy={720} r={r} fill="none" stroke="#9d86ff" strokeWidth={2} style={{ opacity: op }} />
}
