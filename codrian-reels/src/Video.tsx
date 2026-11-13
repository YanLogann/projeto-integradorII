import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C, W, H, s2f} from './theme';
import {Captions} from './Captions';
import {Scrim, Grade, Beam, Shock, shakeAt} from './Fx';
import * as S from './Shots';
import * as S2m from './Shots2';

export const CUTS: [number, number, React.FC][] = [
  [0, 2.6, S2m.S1],
  [2.6, 6.0, S2m.S2],
  [6.0, 10.9, S2m.S3],
  [10.9, 16.0, S2m.S4],
  [16.0, 19.8, S2m.S5],
  [19.8, 26.0, S.ShotClose],
];

export const Video: React.FC = () => {
  const f = useCurrentFrame();
  const sh = shakeAt(f);
  return (
    <AbsoluteFill style={{background: C.navy}}>
      <AbsoluteFill style={{transform: `translate(${sh.x}px, ${sh.y}px) scale(1.03)`}}>
        {CUTS.map(([a, b, Comp], i) => (
          <Sequence key={i} from={s2f(a)} durationInFrames={s2f(b) - s2f(a)}>
            <Comp />
          </Sequence>
        ))}
      </AbsoluteFill>
      <Sequence from={0} durationInFrames={s2f(19.8)}>
        <S2m.CallBar />
      </Sequence>
      <Scrim />
      <Grade />
      <Beam />
      <Shock />
      <Captions />
      <Audio src={staticFile('audio.wav')} />
    </AbsoluteFill>
  );
};
