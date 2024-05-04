import type { Dimensions } from '../../../types';
import type { ItemGroups } from './types';

export const groupItems = (
  indexToKey: Array<string>,
  dimensions: Record<string, Dimensions>,
  itemsGap: number,
  limitedDimension: 'height' | 'width',
  limit: number
): ItemGroups | null => {
  'worklet';
  const groups: ItemGroups = [];
  let currentGroup: Array<string> = [];
  let groupHeight = 0;
  let groupWidth = 0;

  for (const key of indexToKey) {
    const itemDimensions = dimensions[key];
    if (!itemDimensions) {
      return null;
    }
    const itemDimension = itemDimensions[limitedDimension];
    const gap = currentGroup.length > 0 ? itemsGap : 0;
    const currentDimension =
      limitedDimension === 'height' ? groupHeight : groupWidth;
    if (currentDimension + (itemDimension + gap) > limit) {
      groups.push({
        dimensions: {
          height: groupHeight,
          width: groupWidth
        },
        items: currentGroup
      });
      currentGroup = [];
      groupHeight = 0;
      groupWidth = 0;
    }

    currentGroup.push(key);
    if (limitedDimension === 'height') {
      groupHeight += itemDimension + gap;
      groupWidth = Math.max(groupWidth, itemDimensions.width);
    } else {
      groupWidth += itemDimension + gap;
      groupHeight = Math.max(groupHeight, itemDimensions.height);
    }
  }

  if (currentGroup.length > 0) {
    groups.push({
      dimensions: {
        height: groupHeight,
        width: groupWidth
      },
      items: currentGroup
    });
  }

  return groups;
};
