import type { Maybe } from '../helperTypes';

export const isPresent = <V>(value: Maybe<V>): value is V => {
  'worklet';
  return value !== undefined && value !== null;
};
