import { motion, useTransform, type MotionValue } from 'motion/react'
import { easeInOut, useLocal, useTween } from '../clock'
import { type SceneTiming } from '../timeline'
import { COPY } from '../script'
import { Kinetic } from '../Kinetic'
import { Ambient, CityWire } from '../Ambient'

type Case = (typeof COPY.serie.cases)[number]

function CaseCard({ c, l, tIn, tOut, first }: { c: Case; l: MotionValue<number>; tIn: number; tOut: number; first: boolean }) {
  // carrossel: quem sai e quem entra andam JUNTOS (mesma curva, mesma duração),
  // separados por 1080px — nunca se sobrepõem. O 1º card entra com ease-out.
  const SWAP = 0.45
  const x = useTransform(l, (t) => {
    if (t < tIn) return 1080
    if (t < tOut) {
      const p = Math.min(1, (t - tIn) / SWAP)
      return 1080 * (1 - (first ? easeOutStrong(p) : easeInOut(p)))
    }
    return -1080 * easeInOut(Math.min(1, (t - tOut) / SWAP))
  })
  // "depois" se revela da esquerda p/ direita logo após o card assentar
  const r = useTween(l, tIn + 0.45, 0.4, 100, 0)
  const clip = useTransform(r, (v) => `inset(0 ${v}% 0 0 round 24px)`)
  const chipOp = useTween(l, tIn + 0.8, 0.2, 0, 1)
  return (
    <motion.div style={{ position: 'absolute', inset: 0, transform: useTransform(x, (v) => `translateX(${v}px)`) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 22 }}>
        <div style={{ fontSize: 54, fontWeight: 700, letterSpacing: '-0.035em' }}>{c.name}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Shot label="ANTES" src={c.before} />
        <Shot label="DEPOIS" src={c.after} accent clip={clip} />
      </div>
      <motion.div style={{ opacity: chipOp, marginTop: 26, display: 'inline-block', background: 'rgba(16,12,28,0.7)', border: '2px solid #9d86ff', color: 'var(--ink)', fontWeight: 700, fontSize: 40, letterSpacing: '-0.02em', padding: '14px 32px', borderRadius: 999 }}>
        {c.result}
      </motion.div>
    </motion.div>
  )
}

function Shot({ label, src, accent, clip }: { label: string; src: string; accent?: boolean; clip?: MotionValue<string> }) {
  return (
    <div>
      <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '0.12em', color: accent ? 'var(--violet-hi)' : 'var(--muted)', height: 54 }}>{label}</div>
      <div style={{ borderRadius: 24, background: 'var(--deep)', border: '2px solid var(--line)', overflow: 'hidden', boxShadow: '0 0 60px rgba(105,56,232,0.45)' }}>
        <motion.img src={src} width={448} height={600} style={{ clipPath: clip, display: 'block', width: '100%', height: 600, objectFit: 'cover' }} />
      </div>
    </div>
  )
}

const easeOutStrong = (p: number) => 1 - Math.pow(1 - p, 4)

export function Serie({ sc }: { sc: SceneTiming }) {
  const l = useLocal(sc.start)
  const D = sc.end - sc.start
  const slot = (D - 0.3) / 3
  const times = [0.15, 0.15 + slot, 0.15 + 2 * slot]
  return (
    <div className="scene">
      <Ambient l={l} floor={false} glowY="55%" />
      <CityWire l={l} opacity={0.25} push={0.02} />
      <div className="safe">
        <div className="title" style={{ fontSize: 112, textShadow: '0 4px 40px rgba(10,6,25,0.8)' }}>
          <Kinetic text={COPY.serie.title[0]} l={l} at={0} />{' '}
          <Kinetic text={'→ ' + COPY.serie.title[1]} l={l} at={0.18} color="#9d86ff" />
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 170, height: 860 }}>
          {COPY.serie.cases.map((c, i) => (
            <CaseCard key={c.name} c={c} l={l} tIn={times[i]} tOut={times[i + 1] ?? 999} first={i === 0} />
          ))}
        </div>
        <div className="pixel" style={{ position: 'absolute', right: 0, top: 1006, fontSize: 24, color: 'var(--muted)' }}>{COPY.serie.disclaimer}</div>
      </div>
    </div>
  )
}
