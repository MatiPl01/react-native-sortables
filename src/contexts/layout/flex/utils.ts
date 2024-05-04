import type { Dimensions } from '../../../types';

export const groupItems = (
  indexToKey: Array<string>,
  dimensions: Record<string, Dimensions>,
  limitedDimension: 'height' | 'width',
  limit: number
): Array<Array<string>> | null => {
  'worklet';
  const groups: Array<Array<string>> = [];
  let currentGroup: Array<string> = [];
  let currentDimension = 0;

  for (const key of indexToKey) {
    const itemDimensions = dimensions[key];
    if (!itemDimensions) {
      return null;
    }
    const itemDimension = itemDimensions[limitedDimension];
    if (currentDimension + itemDimension > limit) {
      groups.push(currentGroup);
      currentGroup = [];
      currentDimension = 0;
    }

    currentGroup.push(key);
    currentDimension += itemDimension;
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
};
