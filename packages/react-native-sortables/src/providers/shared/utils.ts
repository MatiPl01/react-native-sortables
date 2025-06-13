import { EXTRA_SWAP_OFFSET } from '../../constants';

export const getAdditionalSwapOffset = (gap: number, size: number) => {
  'worklet';
  return Math.max(
    EXTRA_SWAP_OFFSET,
    Math.min(gap / 2 + EXTRA_SWAP_OFFSET, (gap + size) / 2)
  );
};
