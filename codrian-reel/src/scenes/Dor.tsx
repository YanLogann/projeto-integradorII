import { motion, useTransform } from 'motion/react'
import { useLocal, useTween } from '../clock'
import { cue, type SceneTiming } from '../timeline'
import { COPY, STORE } from '../script'

const ty = (v: any) => useTransform(v, (y: number) => `translateY(${y}px)`)

export function Dor({ sc }: { sc: SceneTiming }) {
  const l = useLocal(sc.start)
  const q = COPY.dor.query
  const typeStart = 0.25
  const perChar = 0.045
  const typeEnd = typeStart + q.length * perChar
  const tEmpty = Math.max(typeEnd + 0.25, cue(sc, 'não', 0, typeEnd + 0.5) - 0.05)
  const tRival = Math.max(tEmpty + 0.4, cue(sc, 'só', 0, tEmpty + 0.8) - 0.05)

  const typed = useTransform(l, (t) => q.slice(0, Math.max(0, Math.floor((t - typeStart) / perChar))))
  const caret = useTransform(l, (t) => (t < typeEnd + 0.1 || Math.floor(t * 2.4) % 2 === 0 ? 1 : 0))

  const boxOp = useTween(l, 0, 0.2, 0, 1)
  const boxY = useTween(l, 0, 0.3, 24, 0)
  const emptyOp = useTween(l, tEmpty, 0.22, 0, 1)
  const emptyY = useTween(l, tEmpty, 0.3, 20, 0)
  const rivalOp = useTween(l, tRival, 0.2, 0, 1)
  const rivalY = useTween(l, tRival, 0.4, 220, 0)
  const emptyDim = useTween(l, tRival, 0.3, 1, 0.35)

  return (
    <div className="scene" style={{ background: 'var(--paper)', color: 'var(--paper-ink)' }}>
      <div className="safe" style={{ paddingTop: 40 }}>
        <motion.div style={{ opacity: boxOp, transform: ty(boxY) }}>
          <div style={{ fontSize: 92, fontWeight: 700, letterSpacing: '-0.03em', textAlign: 'center', marginBottom: 44, color: '#3c3c3c' }}>
            Google
          </div>
          <div
            style={{
              height: 128, borderRadius: 64, border: '3px solid #d8d6d0', background: '#fff',
              display: 'flex', alignItems: 'center', gap: 26, padding: '0 44px', boxShadow: '0 6px 24px #0000000f',
            }}
          >
            <SearchIcon />
            <div style={{ fontSize: 50, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden' }}>
              <motion.span>{typed}</motion.span>
              <motion.span style={{ opacity: caret, display: 'inline-block', width: 4, height: 56, background: '#1a73e8', verticalAlign: -8, marginLeft: 4 }} />
            </div>
          </div>
        </motion.div>

        <motion.div style={{ opacity: useTransform([emptyOp, emptyDim] as const, ([a, b]: number[]) => a * b), transform: ty(emptyY), marginTop: 64, padding: '0 12px' }}>
          <div style={{ fontSize: 48, fontWeight: 600, lineHeight: 1.2 }}>
            {COPY.dor.empty} <b style={{ fontWeight: 800 }}>“{q}”</b>
          </div>
          <div style={{ fontSize: 34, color: '#6b6963', marginTop: 16 }}>{COPY.dor.emptyHint}</div>
        </motion.div>

        <motion.div
          style={{
            opacity: rivalOp, transform: ty(rivalY),
            position: 'absolute', left: 0, right: 0, bottom: 230,
            background: '#fff', borderRadius: 36, padding: '40px 44px',
            boxShadow: '0 24px 60px #00000024', border: '3px solid var(--red)',
          }}
        >
          <div style={{ display: 'inline-block', background: 'var(--red)', color: '#fff', fontWeight: 800, fontSize: 30, letterSpacing: '0.06em', padding: '8px 18px', borderRadius: 10, marginBottom: 22 }}>
            SEU CONCORRENTE
          </div>
          <div style={{ fontSize: 62, fontWeight: 800, letterSpacing: '-0.02em' }}>{STORE.competitor}</div>
          <div style={{ fontSize: 38, marginTop: 10, color: '#3c3c3c', display: 'flex', gap: 14, alignItems: 'center' }}>
            <b>{STORE.competitorRating}</b>
            <span style={{ color: '#f5a400', letterSpacing: 2 }}>★★★★★</span>
            <span style={{ color: '#6b6963' }}>({STORE.competitorReviews})</span>
          </div>
          <div style={{ fontSize: 36, marginTop: 8, color: '#188038', fontWeight: 600 }}>
            Aberto agora <span style={{ color: '#6b6963', fontWeight: 400 }}>· {STORE.city}</span>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 28 }}>
            {['Rotas', 'Ligar', 'Site'].map((b) => (
              <div key={b} style={{ fontSize: 34, fontWeight: 700, color: '#1a5fd0', border: '2px solid #d8d6d0', borderRadius: 40, padding: '12px 32px' }}>{b}</div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6b6963" strokeWidth="2.4" strokeLinecap="round">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 21 21" />
    </svg>
  )
}
