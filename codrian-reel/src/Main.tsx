import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {City, FOV} from './City';
import {Overlay} from './Overlay';
import {C} from './brand';

const FONTS: [string, string, string][] = [
  ['DM Sans', 'fonts/DMSans-500.woff2', '500'],
  ['DM Sans', 'fonts/DMSans-700.woff2', '700'],
  ['Silkscreen', 'fonts/Silkscreen-400.woff2', '400'],
];

export const Main: React.FC<{withAudio: boolean}> = ({withAudio}) => {
  const {width, height} = useVideoConfig();
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all(
      FONTS.map(([fam, file, weight]) => {
        const f = new FontFace(fam, `url(${staticFile(file)})`, {weight});
        document.fonts.add(f);
        return f.load();
      }),
    ).then(() => continueRender(handle));
  }, [handle]);
  return (
    <AbsoluteFill style={{background: C.void}}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{fov: FOV, near: 0.1, far: 200, position: [15, 7.5, 21]}}
        gl={{antialias: true, preserveDrawingBuffer: true}}
      >
        <City />
      </ThreeCanvas>
      <AbsoluteFill style={{transform: `scale(${width / 1080})`, transformOrigin: '0 0', width: 1080, height: 1920}}>
        <Overlay />
      </AbsoluteFill>
      {withAudio && <Audio src={staticFile('audio/mix.wav')} />}
    </AbsoluteFill>
  );
};
