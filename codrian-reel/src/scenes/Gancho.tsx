import { motion, useTransform } from 'motion/react'
import { useLocal, useTween, useSpringAt } from '../clock'
import { cue, type SceneTiming } from '../timeline'
import { COPY } from '../script'
import { Kinetic, easeExpo } from '../Kinetic'
import { Ambient, CityWire } from '../Ambient'

export function Gancho({ sc }: { sc: SceneTiming }) {
  const l = useLocal(sc.start)
  const tSo = cue(sc, 'só', 0, 0.15)
  const tNo = cue(sc, 'no', 0, 0.45)
  const tIg = Math.max(cue(sc, 'instagram', 0, 0.8), tNo + 0.12)
  const tShake = Math.min(tIg + 0.45, 1.25)

  const soP = useTransform(l, (t) => easeExpo(Math.min(1, Math.max(0, (t - tSo + 0.05) / 0.5))))
  const soOpacity = useTween(l, tSo - 0.05, 0.16, 0, 1)
  const shakeX = useSpringAt(l, tShake, 46, 0, { stiffness: 1400, damping: 11 })
  // a cor de destaque dos Reels é o violeta claro
  const soColor = useTransform(l, [tShake, tShake + 0.14], ['#f4f1ff', '#9d86ff'])
  const soTransform = useTransform(
    [soP, shakeX] as const,
    ([p, x]: number[]) => `translateX(${x}px) rotate(${x * 0.08}deg) translateY(${(1 - p) * 60}px) scale(${0.92 + 0.08 * p})`,
  )
  const soFilter = useTransform(soP, (p) => (p >= 0.999 ? 'none' : `blur(${(1 - p) * 18}px)`))
  const glow = useTransform(l, [tShake, tShake + 0.2], ['0 0 0px rgba(139,108,255,0)', '0 0 60px rgba(139,108,255,0.7)'])

  return (
    <div className="scene">
      <Ambient l={l} floor={false} glowY="45%" />
      <CityWire l={l} opacity={0.55} />
      <div className="safe" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingBottom: 60 }}>
        <motion.div
          className="title"
          style={{ opacity: soOpacity, transform: soTransform, filter: soFilter, color: soColor, textShadow: glow, fontSize: 480, lineHeight: 0.86 }}
        >
          {COPY.gancho.pre}
        </motion.div>
        <div className="title" style={{ textAlign: 'center', fontSize: 140, lineHeight: 0.98, marginTop: 10, textShadow: '0 4px 40px rgba(10,6,25,0.8)' }}>
          <div><Kinetic text="NO" l={l} at={tNo - 0.06} /></div>
          <div><Kinetic text="INSTAGRAM?" l={l} at={tIg - 0.06} stagger={0.03} /></div>
        </div>
      </div>
    </div>
  )
}
