'worklet';
import type { ExtrapolationType } from 'react-native-reanimated';
import { Extrapolation, interpolate } from 'react-native-reanimated';

export const calculateRawProgress = (
  position: number,
  containerPos: number,
  scrollablePos: number,
  scrollableSize: number,
  activationOffset: [number, number],
  contentBounds: [number, number],
  maxOverscroll: [number, number],
  extrapolation: ExtrapolationType
) => {
  const startDistance = containerPos + contentBounds[0];
  const startBoundProgress = interpolate(
    startDistance,
    [-activationOffset[0], maxOverscroll[0]],
    [1, 0],
    Extrapolation.CLAMP
  );

  const contentEndPos = containerPos + contentBounds[1];
  const endDistance = scrollablePos + scrollableSize - contentEndPos;
  const endBoundProgress = interpolate(
    endDistance,
    [-activationOffset[1], maxOverscroll[1]],
    [1, 0],
    Extrapolation.CLAMP
  );

  const startBound = scrollablePos - containerPos;
  const startThreshold = startBound + activationOffset[0];
  const endBound = startBound + scrollableSize;
  const endThreshold = endBound - activationOffset[1];

  console.log(position, [startBound, startThreshold, endThreshold, endBound]);

  return interpolate(
    position,
    [startBound, startThreshold, endThreshold, endBound],
    [-startBoundProgress, 0, 0, endBoundProgress],
    extrapolation
  );
};
