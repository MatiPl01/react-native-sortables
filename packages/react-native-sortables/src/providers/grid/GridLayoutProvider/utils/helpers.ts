'worklet';
import { areValuesDifferent } from '../../../../utils';

export const getMainIndex = (index: number, numGroups: number): number =>
  +index % numGroups;

export const getCrossIndex = (index: number, numGroups: number): number =>
  Math.floor(+index / numGroups);

export const shouldUpdateContainerDimensions = (
  currentContainerCrossSize: null | number,
  calculatedContainerCrossSize: number,
  hasAutoOffsetAdjustment: boolean
): boolean =>
  !currentContainerCrossSize ||
  (areValuesDifferent(
    currentContainerCrossSize,
    calculatedContainerCrossSize,
    1
  ) &&
    (!hasAutoOffsetAdjustment ||
      calculatedContainerCrossSize > currentContainerCrossSize));
