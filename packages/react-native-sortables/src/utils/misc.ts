'worklet';

import type { Maybe } from '../helperTypes';

export const isPresent = <V>(value: Maybe<V>): value is V =>
  value !== undefined && value !== null;
