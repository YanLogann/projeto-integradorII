import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {C, FONT, s2f} from './theme';
import {pop} from './anim';

export type Cap = {t0: number; t1: number; text: string; y?: number; size?: number; color?: string; hl?: string};

const Cap1: React.FC<{cap: Cap; dur: number}> = ({cap, dur}) => {
  const f = useCurrentFrame();
  const size = cap.size ?? 104;
  const out = Math.max(0, f - (dur - 4)) / 4;
  const lines = cap.text.split('\n');
  let idx = 0;
  return (
    <AbsoluteFill style={{alignItems: 'center', pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          top: (cap.y ?? 1250) - 260,
          height: 520,
          width: 880,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: size,
          lineHeight: 1.06,
          transform: `scale(${1 - out * 0.4})`,
          opacity: 1 - out,
        }}
      >
        {lines.map((line, li) => (
          <div key={li} style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: size * 0.25}}>
            {line.split(' ').map((w, wi) => {
              const hl = w.startsWith('*');
              const clean = w.replace(/\*/g, '');
              const d = idx++ * 2;
              const sc = pop(f, d);
              const r = (idx % 2 ? 1 : -1) * (1 - Math.min(1, sc)) * 8;
              return (
                <span
                  key={wi}
                  style={{
                    display: 'inline-block',
                    color: hl ? C.yellow : cap.color ?? '#fff',
                    WebkitTextStroke: `${Math.round(size * 0.16)}px ${C.navy}`,
                    paintOrder: 'stroke fill',
                    transform: `scale(${Math.max(0, sc)}) rotate(${r}deg)`,
                    textShadow: `0 ${Math.round(size * 0.07)}px 0 ${C.navy}`,
                  }}
                >
                  {clean}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const CAPS: Cap[] = [
  {t0: 0.9, t1: 3.0, text: 'O *Outlook* caiu.', size: 124},
  {t0: 3.0, t1: 5.5, text: 'Eu preciso mandar o *orçamento!*', size: 108},
  {t0: 5.5, t1: 7.5, text: 'Não me deixa, *monitor!*', size: 108},
  {t0: 7.5, t1: 9.0, text: 'Sua ligação é *muito importante* para nós…', size: 92},
  {t0: 10.3, t1: 12.0, text: '*Calma.*', size: 150},
  {t0: 12.0, t1: 15.0, text: 'O cliente que tem site chama no *WhatsApp.*', size: 100},
  {t0: 15.0, t1: 17.4, text: 'Um toque no botão do site…', size: 100, y: 1330},
  {t0: 17.4, t1: 18.5, text: 'Chegou *cliente!*', size: 120, y: 1330},
  {t0: 18.5, t1: 19.8, text: '*…silêncio…*', size: 110},
  {t0: 19.8, t1: 20.8, text: '…e o e-mail?', size: 120},
  {t0: 20.8, t1: 21.8, text: '*Que e-mail?*', size: 130},
  {t0: 22.3, t1: 26.0, text: 'Seu e-mail pode cair.', size: 92, y: 900},
  {t0: 23.3, t1: 26.0, text: 'Seu cliente não precisa ficar sem te achar.', size: 84, y: 1170, color: '#fff'},
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
