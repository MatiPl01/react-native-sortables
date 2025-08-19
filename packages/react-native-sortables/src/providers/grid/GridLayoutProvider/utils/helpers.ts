'worklet';

import { areValuesDifferent } from '../../../../utils';

export const getMainIndex = (index: number, numGroups: number): number => {
  return +index % numGroups;
};

export const getCrossIndex = (index: number, numGroups: number): number => {
  return Math.floor(+index / numGroups);
};

export const shouldUpdateContainerDimensions = (
  currentContainerCrossSize: null | number,
  calculatedContainerCrossSize: number,
  hasAdditionalCrossOffset: boolean
): boolean =>
  !currentContainerCrossSize ||
  (areValuesDifferent(
    currentContainerCrossSize,
    calculatedContainerCrossSize,
    1
  ) &&
    (!hasAdditionalCrossOffset ||
      calculatedContainerCrossSize > currentContainerCrossSize));
