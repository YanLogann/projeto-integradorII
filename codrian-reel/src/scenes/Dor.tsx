import { motion, useTransform } from 'motion/react'
import { useLocal, useTween } from '../clock'
import { cue, type SceneTiming } from '../timeline'
import { COPY, STORE } from '../script'

const ty = (v: any) => useTransform(v, (y: number) => `translateY(${y}px)`)
const THUMBS = ['#e9b8a8', '#f2d27a', '#c7a07a']

export function Dor({ sc }: { sc: SceneTiming }) {
  const l = useLocal(sc.start)
  const q = COPY.dor.query
  const typeStart = 0.2
  const perChar = 0.04
  const typeEnd = typeStart + q.length * perChar
  const tRes = Math.max(typeEnd + 0.15, cue(sc, 'google', 0, typeEnd + 0.3) + 0.15)
  const tMiss = Math.max(tRes + 0.4, cue(sc, 'apresentação', 0, tRes + 1) - 0.1)
  const tRival = Math.max(tMiss + 0.5, cue(sc, 'concorrente', 0, tMiss + 1.2) - 0.35)

  const typed = useTransform(l, (t) => q.slice(0, Math.max(0, Math.floor((t - typeStart) / perChar))))
  const caret = useTransform(l, (t) => (t < typeEnd + 0.1 || Math.floor(t * 2.4) % 2 === 0 ? 1 : 0))

  const boxOp = useTween(l, 0, 0.2, 0, 1)
  const boxY = useTween(l, 0, 0.3, 24, 0)
  const res = [useTween(l, tRes, 0.22, 0, 1), useTween(l, tRes + 0.07, 0.22, 0, 1)]
  const resY = [useTween(l, tRes, 0.32, 20, 0), useTween(l, tRes + 0.07, 0.32, 20, 0)]
  const missOp = useTween(l, tMiss, 0.22, 0, 1)
  const missScale = useTween(l, tMiss, 0.32, 0.96, 1)
  const rivalOp = useTween(l, tRival, 0.2, 0, 1)
  const rivalY = useTween(l, tRival, 0.42, 260, 0)
  const dim = useTween(l, tRival, 0.3, 1, 0.3)

  return (
    <div className="scene" style={{ background: 'var(--paper)', color: 'var(--paper-ink)' }}>
      <div className="safe" style={{ paddingTop: 30 }}>
        <motion.div style={{ opacity: boxOp, transform: ty(boxY) }}>
          <div className="title" style={{ fontSize: 84, textAlign: 'center', marginBottom: 36, color: '#3c3a44' }}>Google</div>
          <div style={{ height: 124, borderRadius: 62, border: '3px solid #dcdae3', display: 'flex', alignItems: 'center', gap: 24, padding: '0 42px', boxShadow: '0 6px 24px #0000000f' }}>
            <SearchIcon />
            <div style={{ fontSize: 48, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden' }}>
              <motion.span>{typed}</motion.span>
              <motion.span style={{ opacity: caret, display: 'inline-block', width: 4, height: 54, background: '#1a73e8', verticalAlign: -8, marginLeft: 4 }} />
            </div>
          </div>
        </motion.div>

        <motion.div style={{ opacity: dim, marginTop: 44 }}>
          {COPY.dor.results.map((r, i) => (
            <motion.div key={i} style={{ opacity: res[i], transform: ty(resY[i]), padding: '0 10px', marginBottom: 30 }}>
              <div style={{ fontSize: 28, color: '#5f5c68' }}>{r.site}</div>
              <div style={{ fontSize: 40, color: '#1a0dab', fontWeight: 500, lineHeight: 1.2, marginTop: 4 }}>{r.title}</div>
              <div style={{ fontSize: 30, color: '#5f5c68', marginTop: 4 }}>{r.snippet}</div>
            </motion.div>
          ))}
          <motion.div
            style={{
              opacity: missOp, scale: missScale, marginTop: 6, border: '4px dashed #c9c5d6', borderRadius: 28,
              padding: '28px 34px', display: 'flex', flexDirection: 'column', gap: 10,
            }}
          >
            <div className="title" style={{ fontSize: 46, color: '#3c3a44', letterSpacing: '-0.03em' }}>{COPY.dor.missingTitle}</div>
            <div style={{ fontSize: 32, color: '#6b6878' }}>{COPY.dor.missing.join(' · ')}</div>
          </motion.div>
        </motion.div>

        <motion.div
          style={{
            opacity: rivalOp, transform: ty(rivalY),
            position: 'absolute', left: 0, right: 0, bottom: 236,
            background: '#fff', borderRadius: 32, padding: '30px 36px',
            boxShadow: '0 24px 70px #10091f33', border: '3px solid var(--red)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'inline-block', background: 'var(--red)', color: '#fff', fontWeight: 700, fontSize: 26, letterSpacing: '0.06em', padding: '6px 16px', borderRadius: 999, marginBottom: 14 }}>
                SEU CONCORRENTE
              </div>
              <div className="title" style={{ fontSize: 54, letterSpacing: '-0.03em' }}>{STORE.competitor}</div>
              <div style={{ fontSize: 32, marginTop: 6, color: '#3c3a44', display: 'flex', gap: 12, alignItems: 'center' }}>
                <b>{STORE.competitorRating}</b><span style={{ color: '#f5a400' }}>★★★★★</span>
                <span style={{ color: '#6b6878' }}>({STORE.competitorReviews})</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
            {THUMBS.map((c, i) => <div key={i} style={{ flex: 1, height: 120, borderRadius: 18, background: c }} />)}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
            {COPY.dor.rivalHas.map((b) => (
              <div key={b} style={{ fontSize: 30, fontWeight: 700, color: '#1a5fd0', border: '2px solid #dcdae3', borderRadius: 999, padding: '10px 26px' }}>{b}</div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#6b6878" strokeWidth="2.4" strokeLinecap="round">
      <circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 21 21" />
    </svg>
  )
}
