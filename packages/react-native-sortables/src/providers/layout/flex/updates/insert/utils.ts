import type { Dimension, Dimensions } from '../../../../../types';
import { reorderInsert } from '../../../../../utils';

export type ItemGroupSwapProps = {
  activeItemKey: string;
  activeItemIndex: number; // can be in different group than the currentGroupIndex
  currentGroupIndex: number;
  groupSizeLimit: number;
  indexToKey: Array<string>;
  keyToIndex: Record<string, number>;
  keyToGroup: Record<string, number>;
  itemDimensions: Record<string, Dimensions>;
  itemGroups: Array<Array<string>>;
  mainDimension: Dimension;
  mainGap: number;
};

type ItemGroupSwapResult = {
  indexToKey: Array<string>;
  itemIndex: number;
  itemIndexInGroup: number;
  groupIndex: number;
};

const getFirstItemIndex = (
  group: Array<string>,
  keyToIndex: Record<string, number>
) => {
  'worklet';
  const firstKey = group[0];
  if (firstKey === undefined) return null;
  return keyToIndex[firstKey] ?? null;
};

export const getTotalGroupSize = (
  group: Array<string>,
  itemDimensions: Record<string, Dimensions>,
  mainDimension: Dimension,
  gap: number
) => {
  'worklet';

  const sizesSum = group.reduce(
    (total, key) => total + (itemDimensions[key]?.[mainDimension] ?? 0),
    0
  );

  return sizesSum + gap * (group.length - 1);
};

const getIndexesWhenSwappedToGroupBefore = ({
  activeItemIndex,
  activeItemKey,
  currentGroupIndex,
  groupSizeLimit,
  itemDimensions,
  itemGroups,
  keyToIndex,
  mainDimension,
  mainGap
}: ItemGroupSwapProps): Omit<ItemGroupSwapResult, 'indexToKey'> | null => {
  'worklet';
  const groupBefore = itemGroups[currentGroupIndex - 1];
  if (!groupBefore || groupSizeLimit === Infinity) return null;

  const groupBeforeBefore = itemGroups[currentGroupIndex - 2];
  const firstIndex = getFirstItemIndex(groupBefore, keyToIndex);
  if (firstIndex === null) return null;

  const firstInGroupBeforeResult = {
    groupIndex: currentGroupIndex - 1,
    itemIndex: firstIndex,
    itemIndexInGroup: 0
  };

  if (!groupBeforeBefore) return firstInGroupBeforeResult;

  // If there is a group (groupBeforeBefore) before the currently checked group,
  // the active item may fit as the last element of this group. This is an
  // unwanted behavior, and, in this case, we need to position the active item
  // as the second element of the currently checked group.
  const groupBeforeBeforeSize = getTotalGroupSize(
    groupBeforeBefore,
    itemDimensions,
    mainDimension,
    mainGap
  );
  const activeMainSize = itemDimensions[activeItemKey]?.[mainDimension] ?? 0;

  // If it doesn't fit, we can put the active item as the first element
  if (groupBeforeBeforeSize + activeMainSize + mainGap > groupSizeLimit) {
    return firstInGroupBeforeResult;
  }

  // Otherwise, we put the active item as the second element of the currently
  // checked group (only if it can fit in this group). If it doesn't fit,
  // we put it as the first element, even though it will be automatically
  // fit in the group before.
  if (firstIndex + 1 < activeItemIndex) {
    return {
      groupIndex: currentGroupIndex - 1,
      itemIndex: firstIndex + 1,
      itemIndexInGroup: 1
    };
  }

  return firstInGroupBeforeResult;
};

const getIndexesWhenSwappedToGroupAfter = ({
  activeItemIndex,
  activeItemKey,
  currentGroupIndex,
  groupSizeLimit,
  indexToKey,
  itemDimensions,
  itemGroups,
  keyToGroup,
  keyToIndex,
  mainDimension,
  mainGap
}: ItemGroupSwapProps): Omit<ItemGroupSwapResult, 'indexToKey'> | null => {
  'worklet';
  if (groupSizeLimit === Infinity) return null;

  // We need to remove the active item from the its group, fit all items
  // in the remaining space between the active item's group and the target group,
  // and then insert the active item in the target group
  const activeItemGroupIndex = keyToGroup[activeItemKey];
  const groupAfterIndex = currentGroupIndex + 1;
  const groupAfter = itemGroups[groupAfterIndex];
  if (activeItemGroupIndex === undefined || !groupAfter) return null;

  const firstInActiveGroupIndex = getFirstItemIndex(
    itemGroups[activeItemGroupIndex]!,
    keyToIndex
  );
  if (firstInActiveGroupIndex === null) return null;

  let totalGroupSize = 0;
  let targetGroupIndex = activeItemGroupIndex;
  let targetItemIndex = firstInActiveGroupIndex;

  for (; targetItemIndex < indexToKey.length; targetItemIndex++) {
    const key = indexToKey[targetItemIndex]!;
    if (key === activeItemKey) continue;

    const itemMainSize = itemDimensions[key]?.[mainDimension] ?? 0;

    // totalGroupSize already includes gap before the new item
    if (totalGroupSize + itemMainSize > groupSizeLimit) {
      targetGroupIndex++;
      if (targetGroupIndex === groupAfterIndex) {
        break;
      }
      totalGroupSize = 0;
    }

    totalGroupSize += itemMainSize + mainGap;
  }

  targetItemIndex--;

  // totalGroupSize is now the size of the group at currentGroupIndex
  // and we want to put the active item at the beginning of the group
  // after this group. If the active item fits in the group at the
  // currentGroupIndex, we can't put it as the first element of the
  // group after this group.
  const activeMainSize = itemDimensions[activeItemKey]?.[mainDimension] ?? 0;

  // If the active item fits in the group at the currentGroupIndex,
  // we have to put it as the second element of the group after this group.
  if (
    totalGroupSize + activeMainSize <= groupSizeLimit &&
    targetItemIndex + 1 > activeItemIndex &&
    targetItemIndex + 1 < indexToKey.length
  ) {
    return {
      groupIndex: groupAfterIndex,
      itemIndex: targetItemIndex + 1,
      itemIndexInGroup: 1
    };
  }

  if (targetItemIndex > activeItemIndex) {
    return {
      groupIndex: groupAfterIndex,
      itemIndex: targetItemIndex,
      itemIndexInGroup: 0
    };
  }

  return null;
};

export const getSwappedToGroupBeforeIndices = (
  props: ItemGroupSwapProps
): ItemGroupSwapResult | null => {
  'worklet';
  const indexes = getIndexesWhenSwappedToGroupBefore(props);
  if (indexes === null) return null;

  return {
    ...indexes,
    indexToKey: reorderInsert(
      props.indexToKey,
      props.activeItemIndex,
      indexes.itemIndex
    )
  };
};

export const getSwappedToGroupAfterIndices = (
  props: ItemGroupSwapProps
): ItemGroupSwapResult | null => {
  'worklet';
  const indexes = getIndexesWhenSwappedToGroupAfter(props);
  if (indexes === null) return null;

  return {
    ...indexes,
    indexToKey: reorderInsert(
      props.indexToKey,
      props.activeItemIndex,
      indexes.itemIndex
    )
  };
};
