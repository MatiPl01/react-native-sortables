'worklet';

import { Extrapolation, interpolate } from 'react-native-reanimated';

import type { Vector } from '../../../types';

export const interpolateVector = (
  progress: number,
  from: Vector,
  to: Vector,
  extrapolation?: Extrapolation
) => {
  const inputRange = [0, 1];
  const extrapolate = extrapolation ?? Extrapolation.CLAMP;
  return {
    x: interpolate(progress, inputRange, [from.x, to.x], extrapolate),
    y: interpolate(progress, inputRange, [from.y, to.y], extrapolate)
  };
};
