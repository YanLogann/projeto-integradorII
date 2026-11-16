import { motion, useTransform } from 'motion/react'
import { useLocal, useTween } from '../clock'
import { cue, type SceneTiming } from '../timeline'
import { COPY, STORE } from '../script'
import { Ambient, Phone } from '../Ambient'

const ty = (v: any) => useTransform(v, (y: number) => `translateY(${y}px)`)
const THUMBS = ['#e9b8a8', '#f2d27a', '#c7a07a']

export function Dor({ sc }: { sc: SceneTiming }) {
  const l = useLocal(sc.start)
  const q = COPY.dor.query
  const typeStart = 0.25
  const perChar = 0.04
  const typeEnd = typeStart + q.length * perChar
  const tRes = Math.max(typeEnd + 0.15, cue(sc, 'google', 0, typeEnd + 0.3) + 0.15)
  const tMiss = Math.max(tRes + 0.4, cue(sc, 'apresentação', 0, tRes + 1) - 0.1)
  const tRival = Math.max(tMiss + 0.5, cue(sc, 'concorrente', 0, tMiss + 1.2) - 0.35)

  const typed = useTransform(l, (t) => q.slice(0, Math.max(0, Math.floor((t - typeStart) / perChar))))
  const caret = useTransform(l, (t) => (t < typeEnd + 0.1 || Math.floor(t * 2.4) % 2 === 0 ? 1 : 0))

  // celular entra subindo do chão
  const phoneY = useTween(l, 0, 0.45, 80, 0)
  const phoneOp = useTween(l, 0, 0.25, 0, 1)
  const res = [useTween(l, tRes, 0.22, 0, 1), useTween(l, tRes + 0.07, 0.22, 0, 1)]
  const resY = [useTween(l, tRes, 0.32, 24, 0), useTween(l, tRes + 0.07, 0.32, 24, 0)]
  const missOp = useTween(l, tMiss, 0.22, 0, 1)
  const missScale = useTween(l, tMiss, 0.32, 0.96, 1)
  const rivalOp = useTween(l, tRival, 0.2, 0, 1)
  const rivalY = useTween(l, tRival, 0.45, 700, 0)
  const dim = useTween(l, tRival, 0.3, 1, 0.35)
  // contorno violeta no card do concorrente (o destaque dos Reels é violeta, não vermelho)
  const ring = useTween(l, tRival + 0.45, 0.3, 0, 1)

  return (
    <div className="scene">
      <Ambient l={l} horizon={1150} />
      <motion.div style={{ position: 'absolute', left: 290, top: 250, opacity: phoneOp, transform: ty(phoneY) }}>
        <Phone width={500} height={1020}>
          <div style={{ padding: '120px 44px 0', color: '#1b1726', fontFamily: 'var(--font)' }}>
            <div style={{ height: 116, borderRadius: 58, border: '3px solid #dcdae3', display: 'flex', alignItems: 'center', gap: 22, padding: '0 38px', boxShadow: '0 6px 24px #0000000f' }}>
              <SearchIcon />
              <div style={{ fontSize: 42, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                <motion.span>{typed}</motion.span>
                <motion.span style={{ opacity: caret, display: 'inline-block', width: 4, height: 50, background: '#1a73e8', verticalAlign: -8, marginLeft: 4 }} />
              </div>
            </div>

            <motion.div style={{ opacity: dim, marginTop: 50 }}>
              {COPY.dor.results.map((r, i) => (
                <motion.div key={i} style={{ opacity: res[i], transform: ty(resY[i]), marginBottom: 44 }}>
                  <div style={{ fontSize: 30, color: '#5f5c68' }}>{r.site}</div>
                  <div style={{ fontSize: 42, color: '#1a0dab', fontWeight: 500, lineHeight: 1.18, marginTop: 6 }}>{r.title}</div>
                  <div style={{ fontSize: 32, color: '#5f5c68', marginTop: 6 }}>{r.snippet}</div>
                </motion.div>
              ))}
              <motion.div style={{ opacity: missOp, scale: missScale, border: '4px dashed #c9c5d6', borderRadius: 30, padding: '34px 36px' }}>
                <div className="title" style={{ fontSize: 46, color: '#3c3a44', letterSpacing: '-0.03em', lineHeight: 1.1 }}>{COPY.dor.missingTitle}</div>
                <div style={{ fontSize: 32, color: '#6b6878', marginTop: 12, lineHeight: 1.3 }}>{COPY.dor.missing.join(' · ')}</div>
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            style={{
              opacity: rivalOp, transform: ty(rivalY),
              position: 'absolute', left: 30, right: 30, bottom: 50,
              background: '#fff', borderRadius: 40, padding: '38px 40px', boxShadow: '0 -20px 80px #10091f40',
            }}
          >
            <motion.div style={{ position: 'absolute', inset: -6, borderRadius: 46, border: '6px solid #6938e8', opacity: ring }} />
            <div style={{ fontSize: 30, fontWeight: 700, color: '#6938e8', letterSpacing: '0.04em', marginBottom: 10 }}>CONCORRENTE</div>
            <div className="title" style={{ fontSize: 58, letterSpacing: '-0.03em', color: '#1b1726' }}>{STORE.competitor}</div>
            <div style={{ fontSize: 34, marginTop: 8, color: '#3c3a44', display: 'flex', gap: 12, alignItems: 'center' }}>
              <b>{STORE.competitorRating}</b><span style={{ color: '#f5a400' }}>★★★★★</span>
              <span style={{ color: '#6b6878' }}>({STORE.competitorReviews})</span>
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 22 }}>
              {THUMBS.map((c, i) => <div key={i} style={{ flex: 1, height: 160, borderRadius: 22, background: c }} />)}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 22, flexWrap: 'wrap' }}>
              {COPY.dor.rivalHas.map((b) => (
                <div key={b} style={{ fontSize: 32, fontWeight: 700, color: '#1a5fd0', border: '2px solid #dcdae3', borderRadius: 999, padding: '10px 28px' }}>{b}</div>
              ))}
            </div>
          </motion.div>
        </Phone>
      </motion.div>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#6b6878" strokeWidth="2.4" strokeLinecap="round">
      <circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 21 21" />
    </svg>
  )
}
