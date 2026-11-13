import React from 'react';
import {Composition, Still, staticFile, delayRender, continueRender} from 'remotion';
import {Video} from './Video';
import {Cover} from './Cover';
import {W, H, FPS} from './theme';

const useFonts = () => {
  const [h] = React.useState(() => delayRender('fonts'));
  React.useEffect(() => {
    const faces = [
      new FontFace('DM Sans', `url(${staticFile('fonts/DMSans-500.woff2')})`, {weight: '500'}),
      new FontFace('DM Sans', `url(${staticFile('fonts/DMSans-700.woff2')})`, {weight: '700'}),
      new FontFace('Silkscreen', `url(${staticFile('fonts/Silkscreen-400.woff2')})`, {weight: '400'}),
    ];
    Promise.all(faces.map((f) => f.load())).then((l) => {
      l.forEach((f) => document.fonts.add(f));
      continueRender(h);
    });
  }, [h]);
};
const withFonts = (C: React.FC): React.FC => () => {
  useFonts();
  return <C />;
};
const V = withFonts(Video);
const CV = withFonts(Cover);

export const Root: React.FC = () => (
  <>
    <Composition id="Reels" component={V} width={W} height={H} fps={FPS} durationInFrames={780} />
    <Still id="Cover" component={CV} width={W} height={H} />
  </>
);
