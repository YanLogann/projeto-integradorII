import React from "react";
import { Composition } from "remotion";
import { InternetComendo } from "./InternetComendo";
import { FPS, DURATION, W, H } from "./theme";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="InternetComendo"
    component={InternetComendo}
    durationInFrames={DURATION}
    fps={FPS}
    width={W}
    height={H}
  />
);
