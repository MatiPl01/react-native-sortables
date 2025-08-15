'worklet';
import type { Maybe } from '../helperTypes';

export const isPresent = <V>(value: Maybe<V>): value is V => {
  return value !== undefined && value !== null;
};
