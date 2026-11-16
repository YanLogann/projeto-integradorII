import { motion, useTransform, type MotionValue } from 'motion/react'
import { easeOut, useLocal, useTween, useSpringAt } from '../clock'
import { cue, type SceneTiming } from '../timeline'
import { COPY, STORE } from '../script'
import { Ambient, Phone } from '../Ambient'
import { usePhoneMotion, Tap } from '../motionKit'

function useEnter(l: MotionValue<number>, at: number, dy = 50) {
  const op = useTween(l, at, 0.22, 0, 1)
  const y = useTween(l, at, 0.34, dy, 0)
  return { opacity: op, transform: useTransform(y, (v) => `translateY(${v}px)`) }
}

const TILES = ['#f2d16b', '#e8a598', '#f6e7c8', '#c9d97a', '#f0b46a', '#e9c9d3', '#d9b38c', '#f4e38a', '#bcd6a2', '#e7b9a0', '#f2dca2', '#cfe0b0', '#f0c08a', '#e3a9b5', '#f6edd4']

export function Virada({ sc }: { sc: SceneTiming }) {
  const l = useLocal(sc.start)
  const T = cue(sc, 'transforma', 0, 0.9)
  const tHero = Math.max(T + 0.35, cue(sc, 'site', 0, T + 1.2) - 0.1)
  const tMenu = Math.max(tHero + 0.3, cue(sc, 'cardápio', 0, 3.6) - 0.08)
  const tAddr = Math.max(tMenu + 0.3, cue(sc, 'endereço', 0, 4.3) - 0.08)
  const tRev = Math.max(tAddr + 0.3, cue(sc, 'avaliações', 0, 5.1) - 0.08)
  const tBtn = Math.max(tRev + 0.3, cue(sc, 'botão', 0, 6.3) - 0.08)
  const tPulse = Math.max(tBtn + 0.4, cue(sc, 'whatsapp', 0, 7.8))

  // celular vivo; câmera aproxima quando o site se completa
  const phoneT = usePhoneMotion(l, [{ at: tMenu, to: 1.05 }])
  const phoneOp = useTween(l, 0, 0.25, 0, 1)
  const tTap = tPulse - 0.05

  // perfil sai com blur; site revela de cima pra baixo
  const igOp = useTween(l, T, 0.3, 1, 0)
  const igBlur = useTween(l, T, 0.3, 0, 10)
  const reveal = useTween(l, T + 0.05, 0.45, 100, 0)
  const siteClip = useTransform(reveal, (r) => `inset(0 0 ${r}% 0)`)
  // flash circular da virada (transição dos Reels)
  const flashP = useTransform(l, (t) => Math.min(1, Math.max(0, (t - T + 0.05) / 0.55)))
  const flashScale = useTransform(flashP, (p) => `scale(${0.1 + 2.6 * easeOut(p)})`)
  const flashOp = useTransform(flashP, (p) => (p <= 0 || p >= 1 ? 0 : 0.85 * (1 - p)))

  const hero = useEnter(l, tHero)
  const menu = useEnter(l, tMenu)
  const addr = useEnter(l, tAddr)
  const rev = useEnter(l, tRev)
  const btn = useEnter(l, tBtn, 90)

  const period = 1.1
  const phase = useTransform(l, (t) => (t < tPulse ? -1 : ((t - tPulse) % period) / period))
  const btnScale = useTransform([phase, l] as const, ([p, t]: number[]) => {
    const press = t >= tTap && t < tTap + 0.25 ? 1 - 0.05 * Math.sin(Math.PI * ((t - tTap) / 0.25)) : 1
    return press * (p < 0 ? 1 : 1 + 0.05 * Math.sin(Math.PI * Math.min(1, p / 0.4)))
  })
  const ringScale = useTransform(phase, (p) => (p < 0 ? 1 : 1 + 0.2 * easeOut(Math.min(1, p / 0.7))))
  const ringOp = useTransform(phase, (p) => (p < 0 ? 0 : 0.6 * (1 - Math.min(1, p / 0.7))))

  return (
    <div className="scene">
      <Ambient l={l} horizon={1150} />
      <motion.div style={{ position: 'absolute', left: 290, top: 250, opacity: phoneOp, transform: phoneT }}>
        <Phone width={500} height={1020} screenBg="#000">
          {/* PERFIL (antes) */}
          <motion.div style={{ opacity: igOp, filter: useTransform(igBlur, (b) => `blur(${b}px)`), position: 'absolute', inset: 0, background: '#000', color: '#fff', padding: '120px 30px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
              <div style={{ width: 170, height: 170, borderRadius: '50%', padding: 7, background: 'linear-gradient(135deg,#f5c542,#e8605b)', flex: 'none' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#f2d16b', border: '6px solid #000', display: 'grid', placeItems: 'center', color: '#3b2a00', fontWeight: 700, fontSize: 60 }}>DL</div>
              </div>
              <div>
                <div style={{ fontSize: 40, fontWeight: 700 }}>{STORE.handle}</div>
                <div style={{ fontSize: 32, color: '#a8a3b8', marginTop: 8 }}>48 posts · 1.240 seguidores</div>
              </div>
            </div>
            <div style={{ fontSize: 34, marginTop: 26 }}>Bolos sob encomenda · pedidos por DM</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 36, marginLeft: -30, marginRight: -30 }}>
              {TILES.map((c, i) => <div key={i} style={{ aspectRatio: '1', background: c }} />)}
            </div>
          </motion.div>

          {/* SITE (depois) */}
          <motion.div style={{ clipPath: siteClip, position: 'absolute', inset: 0, background: '#fbfaf7', color: '#151515', display: 'flex', flexDirection: 'column', paddingTop: 80 }}>
            <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 30, color: '#55534d', background: '#ecebe6', padding: '10px 34px', borderRadius: 30 }}>docelima.com.br</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '24px 44px', borderBottom: '2px solid #e6e4de' }}>
              <div style={{ width: 76, height: 76, borderRadius: '50%', background: '#f2d16b', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 30, color: '#3b2a00' }}>DL</div>
              <div style={{ fontSize: 46, fontWeight: 700, letterSpacing: '-0.02em' }}>{STORE.short}</div>
            </div>
            <div style={{ padding: '36px 44px 0', display: 'flex', flexDirection: 'column', gap: 40 }}>
              <motion.div style={hero}>
                <div style={{ height: 300, borderRadius: 28, background: 'linear-gradient(135deg,#f2d16b,#e8a598)', marginBottom: 26 }} />
                <div className="title" style={{ fontSize: 76, lineHeight: 1.0 }}>{COPY.virada.heroTitle}</div>
                <div style={{ fontSize: 36, color: '#55534d', marginTop: 12 }}>{COPY.virada.heroSub}</div>
              </motion.div>
              <motion.div style={menu}>
                <SectionTitle>Cardápio</SectionTitle>
                {COPY.virada.menu.map((m, i) => <MenuRow key={m.item} l={l} at={tMenu + 0.12 + i * 0.07} item={m.item} price={m.price} />)}
              </motion.div>
              <motion.div style={{ ...addr, display: 'flex', gap: 24, alignItems: 'center' }}>
                <MapThumb l={l} at={tAddr + 0.15} />
                <div>
                  <SectionTitle>Como chegar</SectionTitle>
                  <div style={{ fontSize: 36 }}>{COPY.virada.address}</div>
                </div>
              </motion.div>
              <motion.div style={rev}>
                <SectionTitle>Avaliações <Stars l={l} at={tRev + 0.15} /> {COPY.virada.rating}</SectionTitle>
                <div style={{ fontSize: 36, fontStyle: 'italic', color: '#3c3c3c' }}>{COPY.virada.review}</div>
              </motion.div>
            </div>
            <motion.div style={{ ...btn, marginTop: 'auto', padding: '0 40px 60px', position: 'relative' }}>
              <motion.div style={{ position: 'absolute', left: 40, right: 40, top: 0, bottom: 60, borderRadius: 999, border: '8px solid var(--wa)', opacity: ringOp, transform: useTransform(ringScale, (s) => `scale(${s}, ${1 + (s - 1) * 2.2})`) }} />
              <motion.div style={{ transform: useTransform(btnScale, (s) => `scale(${s})`), height: 130, borderRadius: 999, background: 'var(--wa)', color: '#062b13', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, fontSize: 48, fontWeight: 700 }}>
                <WaIcon /> {COPY.virada.whatsapp}
              </motion.div>
            </motion.div>
          </motion.div>
          <Tap l={l} at={tTap} x={420} y={1636} size={170} color="#ffffff" />
        </Phone>
      </motion.div>
      <motion.div style={{ position: 'absolute', left: 540 - 500, top: 760 - 500, width: 1000, height: 1000, borderRadius: '50%', background: 'radial-gradient(circle, rgba(157,134,255,0.0) 40%, rgba(157,134,255,0.9) 62%, rgba(157,134,255,0) 70%)', opacity: flashOp, transform: flashScale }} />
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7a776f', marginBottom: 8 }}>{children}</div>
}
function MenuRow({ l, at, item, price }: { l: MotionValue<number>; at: number; item: string; price: string }) {
  const s = useEnter(l, at, 24)
  return (
    <motion.div style={{ ...s, display: 'flex', justifyContent: 'space-between', fontSize: 38, padding: '10px 0', borderBottom: '2px solid #ebe9e3' }}>
      <span>{item}</span><b>{price}</b>
    </motion.div>
  )
}

/** pin cai no mapa com spring curta */
function MapThumb({ l, at }: { l: MotionValue<number>; at: number }) {
  const y = useSpringAt(l, at, -60, 0, { stiffness: 420, damping: 16 })
  const op = useTween(l, at, 0.12, 0, 1)
  return (
    <svg width="150" height="124" viewBox="0 0 120 100" style={{ borderRadius: 18, flex: 'none', overflow: 'hidden' }}>
      <rect width="120" height="100" fill="#e3efe0" />
      <path d="M0 62 L120 40 M38 0 L58 100 M0 20 L120 88" stroke="#fff" strokeWidth="9" />
      <motion.g style={{ y, opacity: op }}>
        <path d="M60 22c-10 0-17 7-17 16 0 13 17 30 17 30s17-17 17-30c0-9-7-16-17-16z" fill="#6938e8" />
        <circle cx="60" cy="38" r="6" fill="#fff" />
      </motion.g>
    </svg>
  )
}

/** estrelas acendem uma a uma */
function Stars({ l, at }: { l: MotionValue<number>; at: number }) {
  return (
    <span>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.span key={i} style={{ color: useTransform(l, (t) => (t >= at + i * 0.07 ? '#f5a400' : '#d6d3cb')) }}>★</motion.span>
      ))}
    </span>
  )
}
function WaIcon() {
  return (
    <svg width="58" height="58" viewBox="0 0 24 24" fill="#062b13">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z" />
    </svg>
  )
}
