export function zipArrays<T, U>(a: Array<T>, b: Array<U>): Array<[T, U]> {
  return a.slice(0, b.length).map((_, i) => [a[i], b[i]]) as Array<[T, U]>;
}
