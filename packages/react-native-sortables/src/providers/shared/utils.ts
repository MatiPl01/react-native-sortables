import { EXTRA_SWAP_OFFSET } from '../../constants';
import type { Maybe } from '../../helperTypes';
import type { Dimensions } from '../../types';

export const getAdditionalSwapOffset = (size?: Maybe<number>) => {
  'worklet';
  return size ? Math.min(EXTRA_SWAP_OFFSET, size / 2) : EXTRA_SWAP_OFFSET;
};

export const resolveDimension = (
  dimension: number | Record<string, number>,
  key: string
) => {
  'worklet';
  return typeof dimension === 'number' ? dimension : dimension[key];
};

export const getItemDimensions = (
  key: string,
  itemWidths: number | Record<string, number>,
  itemHeights: number | Record<string, number>
): Dimensions | null => {
  'worklet';
  const itemWidth = resolveDimension(itemWidths, key);
  const itemHeight = resolveDimension(itemHeights, key);

  if (itemWidth === undefined || itemHeight === undefined) {
    return null;
  }

  return { height: itemHeight, width: itemWidth };
};
