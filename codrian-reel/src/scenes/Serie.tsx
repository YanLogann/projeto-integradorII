import { motion, useTransform, type MotionValue } from 'motion/react'
import { easeInOut, useLocal, useTween } from '../clock'
import { type SceneTiming } from '../timeline'
import { COPY } from '../script'

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
        <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-0.015em' }}>{c.name}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Shot label="ANTES" src={c.before} />
        <Shot label="DEPOIS" src={c.after} accent clip={clip} />
      </div>
      <motion.div style={{ opacity: chipOp, marginTop: 26, display: 'inline-block', background: 'var(--brand)', color: 'var(--brand-ink)', fontWeight: 800, fontSize: 44, padding: '12px 26px', borderRadius: 16 }}>
        {c.result}
      </motion.div>
    </motion.div>
  )
}

function Shot({ label, src, accent, clip }: { label: string; src: string; accent?: boolean; clip?: MotionValue<string> }) {
  return (
    <div>
      <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '0.1em', color: accent ? 'var(--brand)' : 'var(--muted)', height: 54 }}>{label}</div>
      <div style={{ borderRadius: 24, background: 'var(--panel)', overflow: 'hidden' }}>
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
  const titleOp = useTween(l, 0, 0.2, 0, 1)
  const titleY = useTween(l, 0, 0.3, 30, 0)
  return (
    <div className="scene">
      <div className="safe">
        <motion.div
          className="condensed"
          style={{ opacity: titleOp, transform: useTransform(titleY, (y) => `translateY(${y}px)`), fontSize: 120, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}
        >
          ANTES <span style={{ color: 'var(--brand)' }}>→</span> DEPOIS
        </motion.div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 170, height: 860 }}>
          {COPY.serie.cases.map((c, i) => (
            <CaseCard key={c.name} c={c} l={l} tIn={times[i]} tOut={times[i + 1] ?? 999} first={i === 0} />
          ))}
        </div>
        <div style={{ position: 'absolute', right: 0, top: 1000, fontSize: 26, color: 'var(--muted)' }}>{COPY.serie.disclaimer}</div>
      </div>
    </div>
  )
}
