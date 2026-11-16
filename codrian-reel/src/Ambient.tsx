import { motion, useTransform, type MotionValue } from 'motion/react'

/**
 * Cenário dos Reels da Codrian (referência: Reels do @codrian_ofc):
 * violeta profundo com brilho radial, bokeh desfocado à deriva e chão escuro
 * com horizonte iluminado e linhas de perspectiva. Tudo função do relógio.
 */
const ORBS = [
  { x: 120, y: 260, r: 70, a: 0.35 }, { x: 930, y: 380, r: 90, a: 0.28 }, { x: 760, y: 120, r: 50, a: 0.3 },
  { x: 230, y: 760, r: 110, a: 0.22 }, { x: 980, y: 900, r: 60, a: 0.3 }, { x: 60, y: 1180, r: 80, a: 0.2 },
  { x: 540, y: 1640, r: 130, a: 0.25 }, { x: 860, y: 1500, r: 70, a: 0.2 },
]

export function Ambient({ l, horizon = 1180, floor = true, glowY = '38%' }: { l: MotionValue<number>; horizon?: number; floor?: boolean; glowY?: string }) {
  return (
    <div className="scene" style={{ background: `radial-gradient(70% 45% at 50% ${glowY}, #4b2bb8 0%, #2a1a6b 38%, #150e33 70%, #0c0818 100%)` }}>
      {ORBS.map((o, i) => <Orb key={i} o={o} i={i} l={l} />)}
      {floor && (
        <>
          <div style={{ position: 'absolute', left: 0, right: 0, top: horizon, bottom: 0, background: 'linear-gradient(#120b2a, #0a0716 60%)' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: horizon - 1, height: 2, background: 'linear-gradient(90deg, transparent, #8b6cff88, transparent)' }} />
          <svg width={1080} height={1920 - horizon} style={{ position: 'absolute', left: 0, top: horizon }}>
            {Array.from({ length: 13 }, (_, k) => k - 6).map((k) => (
              <line key={k} x1={540 + k * 30} y1={0} x2={540 + k * 260} y2={1920 - horizon} stroke="#6938e8" strokeOpacity={0.22} strokeWidth={1.5} />
            ))}
          </svg>
        </>
      )}
    </div>
  )
}

function Orb({ o, i, l }: { o: (typeof ORBS)[number]; i: number; l: MotionValue<number> }) {
  const transform = useTransform(l, (t) => `translate(${Math.sin(t * 0.35 + i) * 18}px, ${Math.cos(t * 0.28 + i * 1.7) * 14}px)`)
  return (
    <motion.div
      style={{
        position: 'absolute', left: o.x - o.r, top: o.y - o.r, width: o.r * 2, height: o.r * 2, borderRadius: '50%',
        background: '#8b6cff', opacity: o.a, filter: 'blur(26px)', transform,
      }}
    />
  )
}

/** celular "em pé" no cenário, com reflexo no chão; o conteúdo é desenhado em largura virtual e escalado */
export function Phone({ children, width = 500, height = 1040, virtualWidth = 840, style, screenBg = '#fff' }: {
  children: React.ReactNode; width?: number; height?: number; virtualWidth?: number; style?: React.CSSProperties; screenBg?: string
}) {
  const bezel = 13
  const sw = width - bezel * 2
  const sh = height - bezel * 2
  const k = sw / virtualWidth
  return (
    <div
      style={{
        width, height, borderRadius: 74, background: '#09070f', position: 'relative',
        boxShadow: '0 0 0 2px #2c2450, inset 0 0 0 2px #3b2f6e, 0 40px 120px rgba(105,56,232,0.45)',
        WebkitBoxReflect: 'below 6px linear-gradient(transparent 72%, rgba(255,255,255,0.18))',
        ...style,
      } as React.CSSProperties}
    >
      <div style={{ position: 'absolute', left: bezel, top: bezel, width: sw, height: sh, borderRadius: 62, overflow: 'hidden', background: screenBg }}>
        <div style={{ width: virtualWidth, height: sh / k, transform: `scale(${k})`, transformOrigin: '0 0', position: 'relative' }}>
          {children}
        </div>
        <div style={{ position: 'absolute', left: '50%', top: 16, width: 150, height: 40, marginLeft: -75, borderRadius: 20, background: '#000' }} />
      </div>
    </div>
  )
}

/** cidade em linhas violeta (prédios em fio), com aproximação lenta da câmera */
export function CityWire({ l, opacity = 1, push = 0.04, riseAt }: { l: MotionValue<number>; opacity?: number; push?: number; riseAt?: number }) {
  const transform = useTransform(l, (t) => `scale(${1 + push * t})`)
  return (
    <motion.svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0, opacity, transform, transformOrigin: '50% 60%' }}>
      {BUILDINGS.map((b, i) => <Building key={i} b={b} l={l} riseAt={riseAt} />)}
    </motion.svg>
  )
}

/** cada prédio sobe do chão em sequência (do centro para fora), curva exponencial */
function Building({ b, l, riseAt }: { b: (typeof BUILDINGS)[number]; l: MotionValue<number>; riseAt?: number }) {
  const delay = Math.abs(b.x + b.w / 2 - 540) / 1400 + (1 - b.o) * 0.25
  const transform = useTransform(l, (t) => {
    if (riseAt === undefined) return 'none'
    const p = Math.min(1, Math.max(0, (t - riseAt - delay) / 0.7))
    const e = p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)
    return `scaleY(${0.001 + 0.999 * e})`
  })
  return (
    <motion.g stroke="#7b5cff" strokeWidth={b.w > 150 ? 2.5 : 2} fill="#140c30" fillOpacity={0.55} strokeOpacity={b.o}
      style={{ transform, transformBox: 'fill-box', transformOrigin: '50% 100%' }}>
      <path d={`M${b.x} ${b.y} h${b.w} v${b.h} h${-b.w} Z`} />
      <path d={`M${b.x} ${b.y} l${b.d} ${-b.d * 0.6} h${b.w} l${-b.d} ${b.d * 0.6}`} fill="#1d1245" />
      <path d={`M${b.x + b.w} ${b.y} l${b.d} ${-b.d * 0.6} v${b.h} l${-b.d} ${b.d * 0.6}`} fill="#100a26" />
    </motion.g>
  )
}

// gerada uma vez, determinística (seed fixa): fileiras de trás para frente
const BUILDINGS = (() => {
  let s = 11
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const out: { x: number; y: number; w: number; h: number; d: number; o: number }[] = []
  const rows = [
    { base: 1060, sc: 0.45, o: 0.35 }, { base: 1200, sc: 0.65, o: 0.5 }, { base: 1420, sc: 0.9, o: 0.75 }, { base: 1760, sc: 1.25, o: 0.95 },
  ]
  for (const row of rows) {
    let x = -60
    while (x < 1100) {
      const w = (90 + r() * 110) * row.sc
      const h = (220 + r() * 520) * row.sc
      out.push({ x, y: row.base - h, w, h, d: 40 * row.sc, o: row.o })
      x += w + (20 + r() * 50) * row.sc
    }
  }
  return out
})()
