import { areValuesDifferent } from '../../../../utils';

export const getMainIndex = (index: number, numGroups: number): number => {
  'worklet';
  return +index % numGroups;
};

export const getCrossIndex = (index: number, numGroups: number): number => {
  'worklet';
  return Math.floor(+index / numGroups);
};

export const shouldUpdateContainerDimensions = (
  currentContainerCrossSize: null | number,
  calculatedContainerCrossSize: number,
  hasAutoOffsetAdjustment: boolean
): boolean => {
  'worklet';
  return (
    !currentContainerCrossSize ||
    !currentContainerCrossSize ||
    (areValuesDifferent(
      currentContainerCrossSize,
      calculatedContainerCrossSize,
      1
    ) &&
      (!hasAutoOffsetAdjustment ||
        calculatedContainerCrossSize > currentContainerCrossSize))
  );
};
