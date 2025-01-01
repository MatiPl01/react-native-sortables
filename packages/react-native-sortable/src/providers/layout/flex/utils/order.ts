import type { Dimension, Dimensions } from '../../../../types';

export type ActiveIndexWhenInGroupOptions = {
  activeItemKey: null | string;
  groupSizeLimit?: number;
  indexToKey: Array<string>;
  itemDimensions?: Record<string, Dimensions>;
  itemGroups: Array<Array<string>>;
  keyToGroup: Record<string, number>;
  keyToIndex: Record<string, number>;
  mainDimension?: Dimension;
  mainGap?: number;
};

export const getActiveIndexWhenInGroup = (
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
  }: ActiveIndexWhenInGroupOptions
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

    return firstIndex;
  }

  // Otherwise, we need to remove the active item from the current group,
  // fit all items in the remaining space between the current group and
  // the target group, and then insert the active item in the target group
  if (groupSizeLimit === Infinity) {
    return indexToKey.length - 1;
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

  return targetItemIndex - 1;
};
