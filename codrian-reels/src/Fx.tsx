import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, random} from 'remotion';
import {C, W, H, s2f} from './theme';

// Camada cinematográfica: scrim, vinheta, grão, luz, feixes de transição, onda de choque
export const Scrim: React.FC = () => (
  <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(16,12,28,0) 48%, rgba(16,12,28,.55) 66%, rgba(16,12,28,.78) 84%, rgba(16,12,28,.6) 100%)'}} />
);

export const Grade: React.FC = () => {
  const f = useCurrentFrame();
  const gx = Math.floor(random('gx' + f) * 120) - 60;
  const gy = Math.floor(random('gy' + f) * 200) - 100;
  return (
    <>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, rgba(16,12,28,0) 45%, rgba(16,12,28,.78) 100%)'}} />
      <AbsoluteFill style={{background: `radial-gradient(circle at ${30 + Math.sin(f * 0.03) * 10}% 12%, rgba(139,108,255,.18), transparent 45%)`, mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{overflow: 'hidden', mixBlendMode: 'overlay', opacity: 0.16}}>
        <Img src={staticFile('grain.png')} style={{position: 'absolute', left: gx - 60, top: gy - 100, width: W + 240, height: H + 400, imageRendering: 'pixelated'}} />
      </AbsoluteFill>
    </>
  );
};

const CUTS = [2.6, 6.0, 10.9, 16.0, 19.8].map(s2f);
export const Beam: React.FC = () => {
  const f = useCurrentFrame();
  const c = CUTS.find((w) => f >= w - 2 && f <= w + 8);
  if (c === undefined) return null;
  const p = (f - (c - 2)) / 10;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          top: -200,
          height: H + 400,
          width: 360,
          left: -500 + p * (W + 1000),
          transform: 'skewX(-16deg)',
          background: `linear-gradient(90deg, transparent, ${C.hi}, #fff, ${C.hi}, transparent)`,
          filter: 'blur(26px)',
          opacity: 0.9 * Math.sin(Math.PI * Math.min(1, p)),
          mixBlendMode: 'screen',
        }}
      />
    </AbsoluteFill>
  );
};

const HITS: [number, string][] = [[0.5, '#fff'], [2.65, C.coral], [19.8, C.lime]];
export const Shock: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {HITS.map(([t, col], i) => {
        const l = f - s2f(t);
        if (l < 0 || l > 18) return null;
        const p = l / 18;
        return (
          <React.Fragment key={i}>
            <AbsoluteFill style={{background: '#fff', opacity: Math.max(0, 0.55 - l * 0.12)}} />
            <div
              style={{
                position: 'absolute',
                left: W / 2,
                top: 1000,
                width: 200 + p * 2200,
                height: 200 + p * 2200,
                marginLeft: -(100 + p * 1100),
                marginTop: -(100 + p * 1100),
                borderRadius: '50%',
                border: `${14 * (1 - p) + 2}px solid ${col}`,
                opacity: 1 - p,
                filter: 'blur(1px)',
              }}
            />
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

// tremida global nos impactos
export const shakeAt = (f: number) => {
  const ev: [number, number][] = [[s2f(0.5), 18], [s2f(2.65), 22], [s2f(19.8), 10]];
  let a = 0;
  for (const [t, amp] of ev) {
    const l = f - t;
    if (l >= 0 && l < 14) a = Math.max(a, amp * (1 - l / 14));
  }
  return {x: (random('gsx' + f) - 0.5) * 2 * a, y: (random('gsy' + f) - 0.5) * 2 * a};
};
void interpolate;
