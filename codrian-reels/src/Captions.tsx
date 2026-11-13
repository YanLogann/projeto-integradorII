import React from 'react';
import {AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {C, FONT, PIXEL, s2f} from './theme';
import {jitter} from './anim';

export type Cap = {t0: number; t1: number; text: string; y?: number; size?: number; who?: string; slam?: boolean};

const OUT = Easing.bezier(0.16, 1, 0.3, 1);

const Word: React.FC<{w: string; f: number; delay: number; size: number}> = ({w, f, delay, size}) => {
  const hl = w.startsWith('*');
  const clean = w.replace(/\*/g, '');
  const p = interpolate(f - delay, [0, 11], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: OUT});
  const base: React.CSSProperties = {
    display: 'inline-block',
    opacity: p,
    transform: `translateY(${(1 - p) * 34}px) scale(${0.9 + 0.1 * p})`,
    filter: `blur(${(1 - p) * 12}px)`,
    color: C.white,
    textShadow: '0 4px 30px rgba(16,12,28,.85), 0 2px 6px rgba(16,12,28,.9)',
    willChange: 'transform',
  };
  if (!hl) return <span style={base}>{clean}</span>;
  return (
    <span
      style={{
        ...base,
        background: `linear-gradient(135deg, ${C.violet}, #7d4dff)`,
        padding: '0.02em 0.2em 0.06em',
        margin: '0 -0.04em',
        borderRadius: '0.24em',
        boxShadow: `0 10px 40px rgba(105,56,232,.65), inset 0 1px 0 rgba(255,255,255,.25)`,
        transform: `${base.transform} rotate(${-1.6 * p}deg)`,
        textShadow: '0 2px 0 rgba(16,12,28,.35)',
      }}
    >
      {clean}
    </span>
  );
};

const Cap1: React.FC<{cap: Cap; dur: number}> = ({cap, dur}) => {
  const f = useCurrentFrame();
  const size = cap.size ?? 104;
  const out = interpolate(f, [dur - 5, dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const slam = cap.slam ? interpolate(f, [0, 9], [1.9, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.6))}) : 1;
  const sh = cap.slam && f < 14 ? jitter(f, (14 - f) * 1.4, 'sl') : {x: 0, y: 0};
  let idx = 0;
  const words = cap.text.split(' ');
  return (
    <AbsoluteFill style={{alignItems: 'center', pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          top: (cap.y ?? 1250) - 300,
          height: 600,
          width: 900,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: 1 - out,
          filter: `blur(${out * 8}px)`,
          transform: `translate(${sh.x}px, ${sh.y}px) scale(${slam * (1 - out * 0.06)})`,
        }}
      >
        {cap.who && (
          <div
            style={{
              fontFamily: PIXEL,
              fontSize: 26,
              letterSpacing: '0.12em',
              color: C.mist,
              background: 'rgba(16,12,28,.78)',
              border: `2px solid ${C.hi}`,
              borderRadius: 999,
              padding: '8px 22px 6px',
              marginBottom: 22,
              opacity: interpolate(f, [0, 8], [0, 1], {extrapolateRight: 'clamp'}),
            }}
          >
            {cap.who}
          </div>
        )}
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: size,
            lineHeight: 1.1,
            letterSpacing: '-0.035em',
            textAlign: 'center',
            textWrap: 'balance' as any,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            columnGap: size * 0.22,
            rowGap: size * 0.04,
          }}
        >
          {words.map((w, i) => (
            <Word key={i} w={w} f={f} delay={(idx++) * 2.5} size={size} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const CAPS: Cap[] = [
  {t0: 0.9, t1: 3.0, text: 'O *Outlook* caiu.', size: 132, slam: true},
  {t0: 3.0, t1: 5.5, text: 'Eu preciso mandar o *orçamento!*', size: 108, who: 'CHEFE'},
  {t0: 5.5, t1: 7.5, text: 'Não me deixa, *monitor!*', size: 112, who: 'COLEGA'},
  {t0: 7.5, t1: 9.0, text: 'Sua ligação é *muito importante* para nós…', size: 92, who: 'SUPORTE'},
  {t0: 10.3, t1: 12.0, text: '*Calma.*', size: 160, who: 'CARA DO SITE', slam: true},
  {t0: 12.0, t1: 15.0, text: 'O cliente que tem site chama no *WhatsApp.*', size: 100, who: 'CARA DO SITE'},
  {t0: 15.0, t1: 17.4, text: 'Um toque no botão do site…', size: 100, y: 1330},
  {t0: 17.4, t1: 18.5, text: 'Chegou *cliente!*', size: 124, y: 1330, slam: true},
  {t0: 18.5, t1: 19.8, text: '…silêncio…', size: 110},
  {t0: 19.8, t1: 20.8, text: '…e o e-mail?', size: 120, who: 'COLEGA'},
  {t0: 20.8, t1: 21.8, text: '*Que e-mail?*', size: 132, who: 'CARA DO SITE', slam: true},
  {t0: 22.3, t1: 26.0, text: 'Seu e-mail pode cair.', size: 92, y: 975},
  {t0: 23.3, t1: 26.0, text: 'Seu cliente não precisa ficar sem te achar.', size: 84, y: 1215},
];

export const Captions: React.FC = () => (
  <>
    {CAPS.map((c, i) => (
      <Sequence key={i} from={s2f(c.t0)} durationInFrames={s2f(c.t1) - s2f(c.t0)}>
        <Cap1 cap={c} dur={s2f(c.t1) - s2f(c.t0)} />
      </Sequence>
    ))}
  </>
);
