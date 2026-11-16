import { motion, useTransform, type MotionValue } from 'motion/react'
import { easeOut, useLocal, useTween } from '../clock'
import { cue, type SceneTiming } from '../timeline'
import { COPY, STORE } from '../script'

/** entrada padrão: 320ms, sobe 40px, ease-out forte */
function useEnter(l: MotionValue<number>, at: number, dy = 40) {
  const op = useTween(l, at, 0.22, 0, 1)
  const y = useTween(l, at, 0.32, dy, 0)
  return { opacity: op, transform: useTransform(y, (v) => `translateY(${v}px)`) }
}

const TILES = ['#f2d16b', '#e8a598', '#f6e7c8', '#c9d97a', '#f0b46a', '#e9c9d3', '#d9b38c', '#f4e38a', '#bcd6a2']

export function Virada({ sc }: { sc: SceneTiming }) {
  const l = useLocal(sc.start)
  const T = cue(sc, 'transforma', 0, 0.9)
  const tHero = Math.max(T + 0.35, cue(sc, 'site', 0, T + 1.2) - 0.1)
  const tMenu = Math.max(tHero + 0.3, cue(sc, 'cardápio', 0, 3.6) - 0.08)
  const tAddr = Math.max(tMenu + 0.3, cue(sc, 'endereço', 0, 4.3) - 0.08)
  const tRev = Math.max(tAddr + 0.3, cue(sc, 'avaliações', 0, 5.1) - 0.08)
  const tBtn = Math.max(tRev + 0.3, cue(sc, 'botão', 0, 6.3) - 0.08)
  const tPulse = Math.max(tBtn + 0.4, cue(sc, 'whatsapp', 0, 7.8))

  // frame entra
  const frame = useEnter(l, 0, 60)

  // perfil sai: opacidade + leve escala + blur (blur costura o crossfade)
  const igOp = useTween(l, T, 0.3, 1, 0)
  const igScale = useTween(l, T, 0.35, 1, 0.96)
  const igBlur = useTween(l, T, 0.3, 0, 8)
  const igStyle = {
    opacity: igOp,
    transform: useTransform(igScale, (s) => `scale(${s})`),
    filter: useTransform(igBlur, (b) => `blur(${b}px)`),
  }
  // site revela de cima pra baixo
  const reveal = useTween(l, T + 0.05, 0.42, 100, 0)
  const siteClip = useTransform(reveal, (r) => `inset(0 0 ${r}% 0 round 44px)`)

  const hero = useEnter(l, tHero)
  const menu = useEnter(l, tMenu)
  const addr = useEnter(l, tAddr)
  const rev = useEnter(l, tRev)
  const btn = useEnter(l, tBtn, 80)

  // pulso do WhatsApp: a cada 1,1s um "kick" 1 → 1.05 → 1 + anel que expande
  const period = 1.1
  const phase = useTransform(l, (t) => (t < tPulse ? -1 : ((t - tPulse) % period) / period))
  const btnScale = useTransform(phase, (p) => (p < 0 ? 1 : 1 + 0.05 * Math.sin(Math.PI * Math.min(1, p / 0.4))))
  const ringScale = useTransform(phase, (p) => (p < 0 ? 1 : 1 + 0.22 * easeOut(Math.min(1, p / 0.7))))
  const ringOp = useTransform(phase, (p) => (p < 0 ? 0 : 0.55 * (1 - Math.min(1, p / 0.7))))

  // título acima da tela
  const labelOp = useTween(l, T, 0.25, 0, 1)

  return (
    <div className="scene">
      <div className="safe" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 10 }}>
        <motion.div className="pixel" style={{ opacity: labelOp, fontSize: 40, color: 'var(--mist)', height: 70, marginBottom: 14, marginTop: 8 }}>
          do perfil ao site
        </motion.div>

        <motion.div style={{ ...frame, position: 'relative', width: 840, height: 920, borderRadius: 44, boxShadow: '0 0 80px 0 rgba(105,56,232,0.55)' }}>
          {/* ---------- PERFIL (antes) */}
          <motion.div
            style={{ ...igStyle, position: 'absolute', inset: 0, borderRadius: 44, background: '#000', border: '3px solid var(--line)', overflow: 'hidden', padding: 36 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <div style={{ width: 150, height: 150, borderRadius: '50%', padding: 6, background: 'linear-gradient(135deg,#f5c542,#e8605b)' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#f2d16b', border: '5px solid #000', display: 'grid', placeItems: 'center', color: '#3b2a00', fontWeight: 900, fontSize: 54 }}>DL</div>
              </div>
              <div>
                <div style={{ fontSize: 40, fontWeight: 700 }}>{STORE.handle}</div>
                <div style={{ fontSize: 30, color: 'var(--muted)', marginTop: 8 }}>48 posts · 1.240 seguidores</div>
                <div style={{ fontSize: 30, marginTop: 8 }}>Bolos sob encomenda · pedidos por DM</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 36 }}>
              {TILES.map((c, i) => (
                <div key={i} style={{ aspectRatio: '1', background: c, borderRadius: 6 }} />
              ))}
            </div>
          </motion.div>

          {/* ---------- SITE (depois) */}
          <motion.div
            style={{
              clipPath: siteClip, position: 'absolute', inset: 0, borderRadius: 44, overflow: 'hidden',
              background: 'var(--paper)', color: 'var(--paper-ink)', display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{ height: 76, background: '#ecebe6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 28, color: '#55534d', background: '#fff', padding: '8px 28px', borderRadius: 30 }}>docelima.com.br</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '22px 40px', borderBottom: '2px solid #e6e4de' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f2d16b', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 26, color: '#3b2a00' }}>DL</div>
              <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.01em' }}>{STORE.short}</div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 22, fontSize: 26, color: '#55534d', fontWeight: 600 }}>
                {COPY.virada.sections.map((s) => <span key={s}>{s}</span>)}
              </div>
            </div>

            <div style={{ padding: '26px 40px 0', display: 'flex', flexDirection: 'column', gap: 22 }}>
              <motion.div style={hero}>
                <div className="title" style={{ fontSize: 60, lineHeight: 1.0 }} >{COPY.virada.heroTitle}</div>
                <div style={{ fontSize: 30, color: '#55534d', marginTop: 10 }}>{COPY.virada.heroSub}</div>
              </motion.div>

              <motion.div style={menu}>
                <SectionTitle>Cardápio</SectionTitle>
                {COPY.virada.menu.map((m) => (
                  <div key={m.item} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 32, padding: '7px 0', borderBottom: '2px solid #ebe9e3' }}>
                    <span>{m.item}</span><b>{m.price}</b>
                  </div>
                ))}
              </motion.div>

              <motion.div style={{ ...addr, display: 'flex', gap: 20, alignItems: 'center' }}>
                <MapThumb />
                <div>
                  <SectionTitle>Como chegar</SectionTitle>
                  <div style={{ fontSize: 30 }}>{COPY.virada.address}</div>
                </div>
              </motion.div>

              <motion.div style={rev}>
                <SectionTitle>
                  Avaliações <span style={{ color: '#f5a400' }}>★ {COPY.virada.rating}</span>
                </SectionTitle>
                <div style={{ fontSize: 30, fontStyle: 'italic', color: '#3c3c3c' }}>{COPY.virada.review}</div>
              </motion.div>
            </div>

            <motion.div style={{ ...btn, marginTop: 'auto', padding: '0 40px 34px', position: 'relative' }}>
              <motion.div style={{ position: 'absolute', left: 40, right: 40, top: 0, bottom: 34, borderRadius: 999, border: '6px solid var(--wa)', opacity: ringOp, transform: useTransform(ringScale, (s) => `scale(${s}, ${1 + (s - 1) * 2.2})`) }} />
              <motion.div
                style={{
                  transform: useTransform(btnScale, (s) => `scale(${s})`),
                  height: 112, borderRadius: 999, background: 'var(--wa)', color: '#062b13',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, fontSize: 44, fontWeight: 800,
                }}
              >
                <WaIcon /> {COPY.virada.whatsapp}
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7a776f', marginBottom: 6 }}>{children}</div>
}

function MapThumb() {
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" style={{ borderRadius: 16, flex: 'none' }}>
      <rect width="120" height="100" fill="#e3efe0" />
      <path d="M0 62 L120 40 M38 0 L58 100 M0 20 L120 88" stroke="#fff" strokeWidth="9" />
      <path d="M60 22c-10 0-17 7-17 16 0 13 17 30 17 30s17-17 17-30c0-9-7-16-17-16z" fill="#ff3b2f" />
      <circle cx="60" cy="38" r="6" fill="#fff" />
    </svg>
  )
}

function WaIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="#062b13">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z" />
    </svg>
  )
}
