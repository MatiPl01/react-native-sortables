'worklet';
export const sum = (arr: Array<number>) => {
  return arr.reduce((acc, val) => acc + val, 0);
};
