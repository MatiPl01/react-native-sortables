'worklet';
import type { ItemSizes, Dimensions } from '../types';

export const resolveDimension = (dimension: ItemSizes, key: string) =>
  dimension &&
  (typeof dimension === 'number' ? dimension : (dimension[key] ?? null));

export const getItemDimensions = (
  key: string,
  itemWidths: ItemSizes,
  itemHeights: ItemSizes
): Dimensions | null => {
  const itemWidth = resolveDimension(itemWidths, key);
  const itemHeight = resolveDimension(itemHeights, key);

  if (itemWidth === null || itemHeight === null) {
    return null;
  }

  return { height: itemHeight, width: itemWidth };
};
