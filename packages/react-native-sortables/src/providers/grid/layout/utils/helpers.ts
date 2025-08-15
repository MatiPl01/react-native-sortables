'worklet';

export const getMainIndex = (index: number, numGroups: number): number => {
  return +index % numGroups;
};

export const getCrossIndex = (index: number, numGroups: number): number => {
  return Math.floor(+index / numGroups);
};
