'worklet';
import type { ExtrapolationType } from 'react-native-reanimated';
import { Extrapolation, interpolate } from 'react-native-reanimated';

export const calculateRawProgress = (
  position: number,
  containerPos: number,
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

  const contentSize = contentBounds[1] - contentBounds[0];
  const endDistance = scrollableSize - contentSize - startDistance;
  const endBoundProgress = interpolate(
    endDistance,
    [-activationOffset[1], maxOverscroll[1]],
    [1, 0],
    Extrapolation.CLAMP
  );

  const startBound = -containerPos;
  const startThreshold = startBound + activationOffset[0];
  const endBound = startBound + scrollableSize;
  const endThreshold = endBound - activationOffset[1];

  return interpolate(
    position,
    [startBound, startThreshold, endThreshold, endBound],
    [-startBoundProgress, 0, 0, endBoundProgress],
    extrapolation
  );
};
