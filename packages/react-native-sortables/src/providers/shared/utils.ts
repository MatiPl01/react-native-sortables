import type { View } from 'react-native';
import type { TouchData } from 'react-native-gesture-handler';
import { type AnimatedRef, measure } from 'react-native-reanimated';

import { EXTRA_SWAP_OFFSET } from '../../constants';
import type { Vector } from '../../types';

export const getAdditionalSwapOffset = (gap: number, size: number) => {
  'worklet';
  return Math.max(
    EXTRA_SWAP_OFFSET,
    Math.min(gap / 2 + EXTRA_SWAP_OFFSET, (gap + size) / 2)
  );
};

export const getTouchPositionInContainer = (
  touch: TouchData,
  relativeRef: AnimatedRef<View>
): Vector | null => {
  'worklet';

  const measurements = measure(relativeRef);
  if (!measurements) {
    return null;
  }

  return {
    x: touch.absoluteX - measurements.pageX,
    y: touch.absoluteY - measurements.pageY
  };
};
