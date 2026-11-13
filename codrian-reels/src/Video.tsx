import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C, W, H, s2f} from './theme';
import {Captions} from './Captions';
import {Scrim, Grade, Beam, Shock, shakeAt} from './Fx';
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
      <Scrim />
      <Grade />
      <Beam />
      <Shock />
      <Captions />
      <Audio src={staticFile('audio.wav')} />
    </AbsoluteFill>
  );
};
