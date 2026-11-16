import { motion, useTransform, type MotionValue } from 'motion/react'
import logo from './logo.json'
import { easeExpo } from '../Kinetic'

/**
 * Logo oficial (curvas do arquivo codrian-logo-negativo.svg) nascendo do ponto,
 * conforme "Motion e som" da ID visual:
 * - ponto cresce 15% → 90%; no impacto vai a 100% e oscila 1 + 0.28·e^(−7t)·cos(14t)
 * - flash lima 50% decaindo em 220ms; dois anéis (lima, violet-hi) até 9×, o 2º 120ms depois
 * - letras da direita p/ esquerda, 85ms entre elas, 950ms cada, vindas de 0.5em à direita
 *   e 0.1em abaixo, desfoque 14px → 0, ease-out-expo
 * Aqui comprimido para caber no Reel (parâmetros abaixo).
 */
const EM = 700 // unidades do viewBox por em (altura de caixa da DM Sans no arquivo)

export function LogoBirth({ l, at, width, grow = 0.45, letterGap = 0.06, letterDur = 0.75 }: {
  l: MotionValue<number>; at: number; width: number; grow?: number; letterGap?: number; letterDur?: number
}) {
  const [vx, vy, vw, vh] = logo.viewBox.split(' ').map(Number)
  const impact = at + grow
  const { cx, cy, r } = logo.dot
  const dotScale = useTransform(l, (t) => {
    if (t < at) return 0
    if (t < impact) return 0.15 + 0.75 * easeExpo((t - at) / grow)
    const s = t - impact
    return 1 + 0.28 * Math.exp(-7 * s) * Math.cos(14 * s)
  })
  const flash = useTransform(l, (t) => (t < impact ? 0 : 0.5 * Math.max(0, 1 - (t - impact) / 0.22)))
  const ring = (delay: number) => {
    const p = useTransform(l, (t) => Math.min(1, Math.max(0, (t - impact - delay) / 0.9)))
    return {
      r: useTransform(p, (v) => r * (1 + 8 * easeExpo(v))),
      opacity: useTransform(p, (v) => (v <= 0 || v >= 1 ? 0 : 0.9 * (1 - v))),
    }
  }
  const r1 = ring(0)
  const r2 = ring(0.12)
  const n = logo.letters.length
  return (
    <svg viewBox={`${vx} ${vy} ${vw} ${vh}`} width={width} height={(width * vh) / vw} style={{ overflow: 'visible', display: 'block' }}>
      <motion.circle cx={cx} cy={cy} r={r1.r} fill="none" stroke="#B7FF4A" strokeWidth={14} style={{ opacity: r1.opacity }} />
      <motion.circle cx={cx} cy={cy} r={r2.r} fill="none" stroke="#8B6CFF" strokeWidth={14} style={{ opacity: r2.opacity }} />
      {logo.letters.map((lt, i) => (
        // da direita para a esquerda: a última letra ("n") nasce primeiro
        <Letter key={i} d={lt.d} l={l} at={impact + 0.05 + (n - 1 - i) * letterGap} dur={letterDur} />
      ))}
      <motion.circle cx={cx} cy={cy} r={r} fill={logo.dot.fill} style={{ scale: dotScale, transformBox: 'fill-box', transformOrigin: 'center' }} />
      <motion.circle cx={cx} cy={cy} r={r * 7} fill="#d8ff9c" style={{ opacity: flash }} />
    </svg>
  )
}

function Letter({ d, l, at, dur }: { d: string; l: MotionValue<number>; at: number; dur: number }) {
  const p = useTransform(l, (t) => easeExpo(Math.min(1, Math.max(0, (t - at) / dur))))
  return (
    <motion.path
      d={d}
      fill={logo.fill}
      style={{
        opacity: useTransform(l, (t) => Math.min(1, Math.max(0, (t - at) / (dur * 0.4)))),
        transform: useTransform(p, (v) => `translate(${(1 - v) * 0.5 * EM}px, ${(1 - v) * 0.1 * EM}px)`),
        filter: useTransform(p, (v) => (v >= 0.999 ? 'none' : `blur(${(1 - v) * 14 * 2.6}px)`)),
      }}
    />
  )
}
