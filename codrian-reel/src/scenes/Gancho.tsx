import { motion, useTransform } from 'motion/react'
import { useLocal, useTween, useSpringAt } from '../clock'
import { cue, type SceneTiming } from '../timeline'
import { COPY } from '../script'

export function Gancho({ sc }: { sc: SceneTiming }) {
  const l = useLocal(sc.start)
  const tSo = cue(sc, 'só', 0, 0.15)
  const tNo = cue(sc, 'no', 0, 0.45)
  const tIg = Math.max(cue(sc, 'instagram', 0, 0.8), tNo + 0.12)
  const tShake = tIg + 0.3

  const soOpacity = useTween(l, tSo - 0.05, 0.18, 0, 1)
  const soScale = useTween(l, tSo - 0.05, 0.3, 0.9, 1)
  // tremida: spring sub-amortecida, determinística
  const shakeX = useSpringAt(l, tShake, 42, 0, { stiffness: 1400, damping: 11 })
  const shakeR = useTransform(shakeX, (x) => x * 0.08)
  const soColor = useTransform(l, [tShake, tShake + 0.16], ['#f5f3ee', '#ff3b2f'])
  const soTransform = useTransform(
    [soScale, shakeX, shakeR] as const,
    ([s, x, r]: number[]) => `translateX(${x}px) rotate(${r}deg) scale(${s})`,
  )

  const noOp = useTween(l, tNo - 0.04, 0.2, 0, 1)
  const noY = useTween(l, tNo - 0.04, 0.3, 36, 0)
  const igOp = useTween(l, tIg - 0.04, 0.2, 0, 1)
  const igY = useTween(l, tIg - 0.04, 0.3, 36, 0)

  return (
    <div className="scene">
      <div
        className="safe condensed"
        style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 8, paddingBottom: 60 }}
      >
        <motion.div
          style={{ opacity: soOpacity, transform: soTransform, color: soColor, fontSize: 560, fontWeight: 900, lineHeight: 0.82, letterSpacing: '-0.03em' }}
        >
          {COPY.gancho.pre}
        </motion.div>
        <div style={{ textAlign: 'center', fontWeight: 900, fontSize: 176, lineHeight: 0.92, letterSpacing: '-0.02em' }}>
          <motion.div style={{ opacity: noOp, transform: useTransform(noY, (y) => `translateY(${y}px)`) }}>NO</motion.div>
          <motion.div style={{ opacity: igOp, transform: useTransform(igY, (y) => `translateY(${y}px)`) }}>INSTAGRAM?</motion.div>
        </div>
      </div>
    </div>
  )
}
