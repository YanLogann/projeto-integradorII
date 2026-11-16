import { useClockState } from './clock'
import { timeline, type Word } from './timeline'

/** quebra a fala em blocos curtos (≤3 palavras / ~18 caracteres, corta na pontuação) */
function chunk(words: Word[]) {
  const out: Word[][] = []
  let cur: Word[] = []
  for (const w of words) {
    cur.push(w)
    const len = cur.map((x) => x.w).join(' ').length
    if (/[.,:?!]$/.test(w.w) || cur.length >= 3 || len >= 16) out.push(cur), (cur = [])
  }
  if (cur.length) out.push(cur)
  return out
}

// cenas cujo texto na tela já É a fala não recebem legenda duplicada
const SKIP = new Set(['gancho'])

const blocks = timeline.scenes
  .filter((s) => !SKIP.has(s.id))
  .flatMap((s) => {
    const cs = chunk(s.words)
    return cs.map((c, i) => ({
      words: c,
      from: c[0].start - 0.06,
      to: i < cs.length - 1 ? cs[i + 1][0].start - 0.06 : Math.min(c.at(-1)!.end + 0.5, s.end),
    }))
  })

export function Captions() {
  // chave = índice do bloco + palavra ativa
  const key = useClockState((t) => {
    const b = blocks.findIndex((b) => t >= b.from && t < b.to)
    if (b === -1) return ''
    const wi = blocks[b].words.findLastIndex((w) => t >= w.start - 0.02)
    return `${b}:${wi}`
  }) as string
  if (!key) return null
  const [b, wi] = key.split(':').map(Number)
  const block = blocks[b]
  return (
    <div className="captions">
      {/* troca seca de bloco: legenda queimada não deve "dançar" */}
      <div key={b} className="cap-line">
        {block.words.map((w, i) => (
          <span key={i} className={'cap-word' + (i === wi ? ' on' : '')}>
            {w.w.replace(/[.,:]$/, '')}{i < block.words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
    </div>
  )
}
