import type { DimensionValue } from 'react-native';

import type { Dimensions } from '../../../../types';
import { resolveDimensionValue } from '../../../../utils';

export const areDimensionsCorrect = (dimensions: Dimensions): boolean => {
  'worklet';
  return dimensions.width >= 0 && dimensions.height >= 0;
};

export const calculateReferenceSize = (
  minSize: DimensionValue | undefined,
  size: DimensionValue | undefined,
  maxSize: DimensionValue | undefined,
  parentSize: number
): number | undefined => {
  'worklet';
  const min = resolveDimensionValue(minSize, parentSize);
  const current = resolveDimensionValue(size, parentSize);
  const max = resolveDimensionValue(maxSize, parentSize);

  let result = current;

  if (max !== undefined && result !== undefined) {
    result = Math.min(max, result);
  }
  if (min !== undefined) {
    result = Math.max(min, result ?? 0);
  }

  return result;
};
