export const zipArrays = <T, U>(a: Array<T>, b: Array<U>): Array<[T, U]> => {
  'worklet';
  return a.slice(0, b.length).map((_, i) => [a[i], b[i]]) as Array<[T, U]>;
};

export const reverseArray = <T>(array: Array<T>): void => {
  'worklet';
  for (let i = 0; i < array.length / 2; i++) {
    [array[i], array[array.length - i - 1]] = [
      array[array.length - i - 1]!,
      array[i]!
    ];
  }
};
