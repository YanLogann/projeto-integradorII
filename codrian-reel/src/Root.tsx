import {Composition} from 'remotion';
import {Reel, ReelProps} from './Reel';
import tl from './timeline.json';

const defaults: ReelProps = {draft: false};
export const Root: React.FC = () => (
  <>
    <Composition id="Reel24" component={Reel} width={1080} height={1920} fps={24}
      durationInFrames={Math.ceil(tl.duration * 24)} defaultProps={defaults} />
    <Composition id="Reel30" component={Reel} width={1080} height={1920} fps={30}
      durationInFrames={Math.ceil(tl.duration * 30)} defaultProps={defaults} />
  </>
);
