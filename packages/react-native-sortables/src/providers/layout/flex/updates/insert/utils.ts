import type { Dimension, Dimensions } from '../../../../../types';
import { reorderInsert } from '../../../../../utils';

export type ItemGroupSwapProps = {
  activeItemKey: string;
  activeItemIndex: number; // can be in different group than the currentGroupIndex
  currentGroupIndex: number;
  groupSizeLimit: number;
  indexToKey: Array<string>;
  keyToIndex: Record<string, number>;
  itemDimensions: Record<string, Dimensions>;
  itemGroups: Array<Array<string>>;
  mainDimension: Dimension;
  mainGap: number;
  fixedKeys: Record<string, boolean> | undefined;
};

export type ItemGroupSwapResult = {
  indexToKey: Array<string>;
  itemIndex: number;
  itemIndexInGroup: number;
  groupIndex: number;
};

const getGroupItemIndex = (
  inGroupIndex: number,
  group: Array<string>,
  keyToIndex: Record<string, number>
) => {
  'worklet';
  const key = group[inGroupIndex]!;
  if (key === undefined) return null;
  return keyToIndex[key] ?? null;
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
  activeItemKey,
  currentGroupIndex,
  fixedKeys,
  groupSizeLimit,
  itemDimensions,
  itemGroups,
  keyToIndex,
  mainDimension,
  mainGap
}: ItemGroupSwapProps): null | Omit<ItemGroupSwapResult, 'indexToKey'> => {
  'worklet';
  if (groupSizeLimit === Infinity) {
    return null;
  }

  const activeMainSize = itemDimensions[activeItemKey]?.[mainDimension] ?? 0;

  for (let groupIdx = currentGroupIndex; groupIdx > 0; groupIdx--) {
    const groupBefore = itemGroups[groupIdx - 1]!;
    const firstInGroupBeforeIndex = getGroupItemIndex(
      0,
      groupBefore,
      keyToIndex
    );
    const lastInGroupBeforeIndex = getGroupItemIndex(
      groupBefore.length - 1,
      groupBefore,
      keyToIndex
    );

    if (firstInGroupBeforeIndex === null || lastInGroupBeforeIndex === null) {
      return null;
    }

    let itemIndex = firstInGroupBeforeIndex;

    const groupBeforeBefore = itemGroups[groupIdx - 2];
    if (groupBeforeBefore) {
      // If there is a group before the group before the active group,
      // we have to check whether the active item won't wrap to this group
      const totalGroupBeforeBeforeSize = getTotalGroupSize(
        groupBeforeBefore,
        itemDimensions,
        mainDimension,
        mainGap
      );
      const canBeFirstInGroupBefore =
        totalGroupBeforeBeforeSize + activeMainSize > groupSizeLimit;
      if (!canBeFirstInGroupBefore) {
        itemIndex++;
      }
    }

    for (; itemIndex < lastInGroupBeforeIndex; itemIndex++) {
      const itemIndexInGroup = itemIndex - firstInGroupBeforeIndex;
      if (!fixedKeys?.[groupBefore[itemIndexInGroup]!]) {
        return { groupIndex: groupIdx - 1, itemIndex, itemIndexInGroup };
      }
    }
  }

  return null;
};

const getIndexesWhenSwappedToGroupAfter = ({
  activeItemKey,
  currentGroupIndex,
  groupSizeLimit,
  indexToKey,
  itemDimensions,
  itemGroups,
  keyToIndex,
  mainDimension,
  mainGap
}: ItemGroupSwapProps): null | Omit<ItemGroupSwapResult, 'indexToKey'> => {
  'worklet';
  if (
    groupSizeLimit === Infinity ||
    currentGroupIndex + 1 >= itemGroups.length
  ) {
    return null;
  }

  const activeGroup = itemGroups[currentGroupIndex]!;
  const firstInActiveGroupIndex = getGroupItemIndex(0, activeGroup, keyToIndex);
  const lastInActiveGroupIndex = getGroupItemIndex(
    activeGroup.length - 1,
    activeGroup,
    keyToIndex
  );
  if (firstInActiveGroupIndex === null || lastInActiveGroupIndex === null) {
    return null;
  }

  // We need to remove the active item from the its group, fit all items
  // in the remaining space between the active item's group and the target group,
  // and then insert the active item in the target group
  let targetItemIndex = firstInActiveGroupIndex;
  let totalGroupSize = 0;
  let nextGroupFirstItemKey: null | string = null;

  for (let i = firstInActiveGroupIndex; i < indexToKey.length; i++) {
    const key = indexToKey[i]!;
    if (key === activeItemKey) continue;

    const itemMainSize = itemDimensions[key]?.[mainDimension] ?? 0;
    if (totalGroupSize + itemMainSize > groupSizeLimit) {
      nextGroupFirstItemKey = key;
      break;
    }

    totalGroupSize += itemMainSize + mainGap;
    targetItemIndex++;
  }

  const activeMainSize = itemDimensions[activeItemKey]?.[mainDimension] ?? 0;
  if (totalGroupSize + activeMainSize > groupSizeLimit) {
    // If the active item can be the first element of the next group (it won't
    // wrap to the current group), we put it in the 1st position of the next group
    return {
      groupIndex: currentGroupIndex + 1,
      itemIndex: targetItemIndex, // is the first item of the next group
      itemIndexInGroup: 0
    };
  }

  if (
    nextGroupFirstItemKey &&
    (itemDimensions[nextGroupFirstItemKey]?.[mainDimension] ?? 0) +
      mainGap +
      activeMainSize <=
      groupSizeLimit
  ) {
    // Otherwise, if it can be the second item of the next group, we put it there
    // to prevent wrapping to the current group
    return {
      groupIndex: currentGroupIndex + 1,
      itemIndex: targetItemIndex + 1, // is the second item of the next group
      itemIndexInGroup: 1
    };
  }

  return {
    groupIndex: currentGroupIndex + 2, // is in a group after the next group
    itemIndex: targetItemIndex + 1, // is after the item from the next group
    itemIndexInGroup: 0
  };
};

export const getSwappedToGroupBeforeIndices = (
  props: ItemGroupSwapProps
): ItemGroupSwapResult | null => {
  'worklet';
  const indexes = getIndexesWhenSwappedToGroupBefore(props);
  if (indexes === null) return null;

  console.log('getSwappedToGroupBeforeIndices', indexes);

  return {
    ...indexes,
    indexToKey: reorderInsert(
      props.indexToKey,
      props.activeItemIndex,
      indexes.itemIndex,
      props.fixedKeys
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
      indexes.itemIndex,
      props.fixedKeys
    )
  };
};
