export const getMainIndex = (index: number, numGroups: number): number => {
  'worklet';
  return +index % numGroups;
};

export const getCrossIndex = (index: number, numGroups: number): number => {
  'worklet';
  return Math.floor(+index / numGroups);
};
