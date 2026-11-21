import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Main';
import {DURATION, FPS} from './brand';

export const Root: React.FC = () => (
  <Composition id="Reel" component={Main} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} defaultProps={{withAudio: false}} />
);
