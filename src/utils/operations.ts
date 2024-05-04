export const sum = (arr: Array<number>) => {
  'worklet';
  return arr.reduce((acc, val) => acc + val, 0);
};
