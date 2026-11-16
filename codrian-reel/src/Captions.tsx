import { Fragment } from 'react'
import { useClockState } from './clock'
import { timeline, type Word } from './timeline'
import { SCENES } from './script'

/**
 * Legenda no estilo dos Reels @codrian_ofc: sem caixa, DM Sans bold, centralizada,
 * a frase vai se montando palavra a palavra conforme a fala (cada palavra entra com
 * fade + desfoque curto) e as palavras-chave ficam em violeta claro.
 */
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')

function chunk(words: Word[]) {
  const out: Word[][] = []
  let cur: Word[] = []
  for (const w of words) {
    cur.push(w)
    const len = cur.map((x) => x.w).join(' ').length
    const strong = /[.?!:]$/.test(w.w)
    if (strong || (len >= 30 && /,$/.test(w.w)) || len >= 44) out.push(cur), (cur = [])
  }
  if (cur.length) out.push(cur)
  return out
}

const SKIP = new Set(['gancho']) // o texto gigante da tela já é a fala
const FADE = 0.18

const blocks = timeline.scenes
  .filter((s) => !SKIP.has(s.id))
  .flatMap((s) => {
    const keys = new Set((SCENES.find((x) => x.id === s.id)?.keywords ?? []).map(norm))
    const cs = chunk(s.words)
    return cs.map((c, i) => ({
      words: c.map((w) => ({ ...w, key: keys.has(norm(w.w)) })),
      from: c[0].start - 0.04,
      to: i < cs.length - 1 ? cs[i + 1][0].start - 0.04 : Math.min(c.at(-1)!.end + 0.6, s.end),
    }))
  })

export function Captions() {
  // re-render por quadro: a opacidade de cada palavra é função contínua do tempo
  const t = useClockState((t) => Math.round(t * 120) / 120) as number
  const b = blocks.find((b) => t >= b.from && t < b.to)
  if (!b) return null
  return (
    <div className="captions">
      <div className="cap-line">
        {b.words.map((w, i) => {
          const p = Math.min(1, Math.max(0, (t - (w.start - 0.03)) / FADE))
          return (
            <Fragment key={i}>
              <span
                className={w.key ? 'cap-word key' : 'cap-word'}
                style={{ opacity: p, filter: p >= 1 ? 'none' : `blur(${(1 - p) * 6}px)` }}
              >
                {w.w}
              </span>
              {i < b.words.length - 1 ? ' ' : ''}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
