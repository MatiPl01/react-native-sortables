import type { ControlledSizes, Dimensions } from '../types';

export const resolveDimension = (dimension: ControlledSizes, key: string) => {
  'worklet';
  return (
    dimension &&
    (typeof dimension === 'number' ? dimension : (dimension[key] ?? null))
  );
};

export const getItemDimensions = (
  key: string,
  itemWidths: ControlledSizes,
  itemHeights: ControlledSizes
): Dimensions | null => {
  'worklet';
  const itemWidth = resolveDimension(itemWidths, key);
  const itemHeight = resolveDimension(itemHeights, key);

  if (itemWidth === null || itemHeight === null) {
    return null;
  }

  return { height: itemHeight, width: itemWidth };
};
