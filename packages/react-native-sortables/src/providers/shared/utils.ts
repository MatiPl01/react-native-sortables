import { EXTRA_SWAP_OFFSET } from '../../constants';

export const getAdditionalSwapOffset = (size: number) => {
  'worklet';
  return Math.min(EXTRA_SWAP_OFFSET, size / 2);
};
