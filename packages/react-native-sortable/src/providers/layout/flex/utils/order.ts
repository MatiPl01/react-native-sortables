import type { Dimension, Dimensions } from '../../../../types';
import { reorderInsert } from '../../../../utils';

export const getIndexToKeyWithActiveInGroup = (
  targetGroupIndex: number,
  {
    activeItemKey,
    groupSizeLimit = Infinity,
    indexToKey,
    itemDimensions = {},
    itemGroups,
    keyToGroup,
    keyToIndex,
    mainDimension = 'width',
    mainGap = 0
  }: {
    activeItemKey: null | string;
    indexToKey: Array<string>;
    keyToIndex: Record<string, number>;
    keyToGroup: Record<string, number>;
    itemGroups: Array<Array<string>>;
    itemDimensions?: Record<string, Dimensions>;
    mainDimension?: Dimension;
    groupSizeLimit?: number;
    mainGap?: number;
  }
) => {
  'worklet';
  if (activeItemKey === null) return null;

  const activeIndex = keyToIndex[activeItemKey];
  if (activeIndex === undefined) return null;

  const currentGroupIndex = keyToGroup[activeItemKey];
  if (currentGroupIndex === undefined) return null;

  // If the target group is not after the current group, we can just
  // insert the active item as the first item in the target group
  if (targetGroupIndex <= currentGroupIndex) {
    const firstKey = itemGroups[targetGroupIndex]?.[0];
    if (firstKey === undefined) return null;

    const firstIndex = keyToIndex[firstKey];
    if (firstIndex === undefined) return null;

    return reorderInsert(indexToKey, activeIndex, firstIndex);
  }

  // Otherwise, we need to remove the active item from the current group,
  // fit all items in the remaining space between the current group and
  // the target group, and then insert the active item in the target group
  if (groupSizeLimit === Infinity) {
    return reorderInsert(indexToKey, activeIndex, indexToKey.length - 1);
  }

  const firstItemKey = itemGroups[currentGroupIndex]?.[0];
  if (firstItemKey === undefined) return null;

  const firstItemIndex = keyToIndex[firstItemKey];
  if (firstItemIndex === undefined) return null;

  let totalGroupSize = 0;
  let newGroupIndex = currentGroupIndex;
  let targetItemIndex = firstItemIndex;

  for (; targetItemIndex < indexToKey.length; targetItemIndex++) {
    const key = indexToKey[targetItemIndex];
    if (key === undefined) return null;
    if (key === activeItemKey) continue;

    const mainItemSize = itemDimensions[key]?.[mainDimension] ?? 0;

    if (totalGroupSize + mainItemSize > groupSizeLimit) {
      newGroupIndex++;
      totalGroupSize = 0;
    }

    totalGroupSize += mainItemSize + mainGap;

    if (newGroupIndex === targetGroupIndex) {
      break;
    }
  }

  return reorderInsert(indexToKey, activeIndex, targetItemIndex);
};
