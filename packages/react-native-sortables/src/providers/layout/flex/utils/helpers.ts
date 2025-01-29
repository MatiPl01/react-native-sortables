import type { Dimensions } from '../../../../types';

export const areDimensionsCorrect = (dimensions: Dimensions): boolean => {
  'worklet';
  return dimensions.width >= 0 && dimensions.height >= 0;
};
