import { EXTRA_SWAP_OFFSET } from '../../constants';
import type { Maybe } from '../../helperTypes';

export const getAdditionalSwapOffset = (size?: Maybe<number>) => {
  'worklet';
  return size ? Math.min(EXTRA_SWAP_OFFSET, size / 2) : EXTRA_SWAP_OFFSET;
};
