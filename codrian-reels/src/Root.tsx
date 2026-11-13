import React from 'react';
import {Composition, Still} from 'remotion';
import {Video} from './Video';
import {Cover} from './Cover';
import {W, H, FPS} from './theme';

export const Root: React.FC = () => (
  <>
    <Composition id="Reels" component={Video} width={W} height={H} fps={FPS} durationInFrames={780} />
    <Still id="Cover" component={Cover} width={W} height={H} />
  </>
);
