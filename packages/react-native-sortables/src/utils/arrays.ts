export const reverseArray = <T>(array: Array<T>): void => {
  'worklet';
  for (let i = 0; i < array.length / 2; i++) {
    [array[i], array[array.length - i - 1]] = [
      array[array.length - i - 1]!,
      array[i]!
    ];
  }
};
