import type { Maybe } from '../types/utils';

export const noop = () => {
  // do nothing
};

export const isPresent = <V>(value: Maybe<V>): value is V => {
  'worklet';
  return value !== undefined && value !== null;
};
