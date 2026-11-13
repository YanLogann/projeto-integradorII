import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C, W, H, s2f} from './theme';
import {Captions} from './Captions';
import * as S from './Shots';

export const CUTS: [number, number, React.FC][] = [
  [0, 1.6, S.ShotScreen],
  [1.6, 3.0, S.ShotOffice],
  [3.0, 5.5, S.ShotBoss],
  [5.5, 7.5, S.ShotHug],
  [7.5, 9.0, S.ShotHold],
  [9.0, 12.0, S.ShotEnter],
  [12.0, 15.0, S.ShotCalm],
  [15.0, 18.5, S.ShotPhone],
  [18.5, 19.8, S.ShotSilence],
  [19.8, 20.8, S.ShotEmail],
  [20.8, 21.8, S.ShotWhat],
  [21.8, 26.0, S.ShotClose],
];
const WIPES = [1.6, 3.0, 5.5, 7.5, 12.0, 15.0, 21.8].map(s2f);

const Wipe: React.FC = () => {
  const f = useCurrentFrame();
  const c = WIPES.find((w) => f >= w - 1 && f <= w + 5);
  if (c === undefined) return null;
  const p = (f - (c - 1)) / 6;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <g transform={`translate(${-500 + p * 2200} 0) skewX(-14)`}>
        <rect x={0} y={-50} width={320} height={H + 100} fill={C.hi} />
        <rect x={-90} y={-50} width={60} height={H + 100} fill={C.violet} />
      </g>
    </svg>
  );
};

export const Video: React.FC = () => (
  <AbsoluteFill style={{background: C.navy}}>
    {CUTS.map(([a, b, Comp], i) => (
      <Sequence key={i} from={s2f(a)} durationInFrames={s2f(b) - s2f(a)}>
        <Comp />
      </Sequence>
    ))}
    <Wipe />
    <Captions />
    <Audio src={staticFile('audio.wav')} />
  </AbsoluteFill>
);
